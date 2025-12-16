import express from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import pool from '../config/database.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Helper to sanitize string
const sanitize = (str) => {
    if (!str) return ''
    return String(str).trim().replace(/"/g, '')
}

// Helper to parse price
const parsePrice = (price) => {
    if (!price) return 0
    // Remove commas and 'won' symbol if present
    const cleanPrice = String(price).replace(/[,원]/g, '').trim()
    return parseInt(cleanPrice) || 0
}

// Process Excel Upload
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)

        let successCount = 0
        let errorCount = 0
        const errors = []

        for (const [index, row] of data.entries()) {
            try {
                // Start a savepoint for this row to isolate errors
                await client.query('SAVEPOINT row_savepoint')

                // Map Excel columns to DB fields
                // Expected columns: Brand, ModelName, ModelNo, Category, Description, B2BPrice, ConsumerPrice, Stock, ImageURL, DetailURL, Manufacturer, Origin, ProductSpec, ProductOptions

                const brand = sanitize(row['Brand'] || row['브랜드'])
                const modelName = sanitize(row['ModelName'] || row['모델명'])
                const modelNo = sanitize(row['ModelNo'] || row['모델번호'])
                const categoryName = sanitize(row['Category'] || row['카테고리'])
                const description = sanitize(row['Description'] || row['상세설명'])
                // Swapped mapping based on user feedback (Corrected)
                const b2bPrice = parsePrice(row['B2BPrice'] || row['실판매가'] || row['판매가'] || row['B2B가'])
                const consumerPrice = parsePrice(row['ConsumerPrice'] || row['소비자가'] || row['소가'])
                const supplyPrice = parsePrice(row['SupplyPrice'] || row['공급가'] || row['매입가'] || 0)

                // If supplyPrice is not provided (0), use b2bPrice (실판매가)
                if (supplyPrice === 0 && b2bPrice > 0) {
                    supplyPrice = b2bPrice
                }
                const stockQuantity = parsePrice(row['Stock'] || row['재고'])

                // Helper to extract URL from HTML if present
                const extractUrl = (raw) => {
                    const str = sanitize(raw)
                    if (!str) return ''
                    // Check for <img ... src=...> pattern (quoted or unquoted, with optional spaces around =)
                    const imgMatch = str.match(/<img[^>]+src\s*=\s*(?:['"]([^'"]+)['"]|(\S+))/i)
                    if (imgMatch) {
                        let url = imgMatch[1] || imgMatch[2]
                        if (url) return url.replace(/[\/>]+$/, '')
                    }
                    return str
                }

                const imageUrl = extractUrl(row['ImageURL'] || row['이미지URL'])
                const detailUrl = sanitize(row['DetailURL'] || row['상세페이지URL']) // Detail URL can be HTML, so keep consistent with sanitize or use extraction if it's meant to be a single image? 
                // User requirement: Detail URL can be HTML. But if they upload <img src=...> in Detail URL column, do they want it as HTML or just the URL?
                // Step 7004 user asked for *multiple* URLs to be converted to images.
                // Step 7129 user asked for complex HTML to be rendered.
                // So DetailURL *should* support raw HTML. But "Image URL" (Main image) must be a single URL.
                // Therefore only imageUrl passes through extractUrl. Detail page URL logic is different.
                // However, wait. If user provided <center><img...></center> for Detail URL, we want to KEEP it as HTML.
                // So for detailUrl, we just use sanitize() which keeps the HTML tags (minus double quotes, which might break attributes...).
                // WAIT. sanitize() removing double quotes `replace(/"/g, '')` BREAKS HTML attributes: <img src="url"> -> <img src=url>.
                // This is risky for complex HTML.
                // If DetailURL is HTML, we should NOT strip double quotes blindly.
                // We should use a safer sanitize for DetailURL or skip it.
                // For Excel upload, let's assume raw HTML should be preserved as much as possible but safe.

                // Let's refine sanitize to NOT strip quotes if it looks like HTML, or just relax it for DetailURL.
                // But `sanitize` function is defined globally in file. 
                // Let's use a specific handling for DetailURL.

                // For main ImageURL, it MUST be a URL.

                // For DetailURL:
                let rawDetail = row['DetailURL'] || row['상세페이지URL']
                let detailUrlClean = ''
                if (rawDetail) {
                    // If it looks like HTML, preserve quotes but maybe trim
                    if (String(rawDetail).trim().match(/^<.+>$/s) || String(rawDetail).includes('<img') || String(rawDetail).includes('<center')) {
                        detailUrlClean = String(rawDetail).trim()
                    } else {
                        detailUrlClean = sanitize(rawDetail)
                    }
                }
                const finalDetailUrl = detailUrlClean

                const manufacturer = sanitize(row['Manufacturer'] || row['제조사'])
                const origin = sanitize(row['Origin'] || row['원산지'])
                const productSpec = sanitize(row['ProductSpec'] || row['제품규격'])
                const productOptions = sanitize(row['ProductOptions'] || row['옵션'])
                const quantityPerCarton = parsePrice(row['QuantityPerCarton'] || row['카톤수량']) || 1
                const shippingFee = parsePrice(row['ShippingFee'] || row['배송비'])
                let shippingFeeIndividual = parsePrice(row['ShippingFeeIndividual'] || row['개별배송비'])

                // If individual shipping fee is missing, use general shipping fee
                if (shippingFeeIndividual === 0 && shippingFee > 0) {
                    shippingFeeIndividual = shippingFee
                }

                const shippingFeeCarton = parsePrice(row['ShippingFeeCarton'] || row['카톤배송비'])
                const isTaxFree = (row['IsTaxFree'] || row['면세여부']) === 'TRUE' || (row['IsTaxFree'] || row['면세여부']) === '면세'
                const remarks = sanitize(row['Remark'] || row['remark'] || row['비고'])

                if (!modelName) {
                    throw new Error('Model Name is required')
                }

                // Find or create category
                let categoryId = null
                if (categoryName) {
                    const catRes = await client.query('SELECT id FROM categories WHERE name = $1', [categoryName])
                    if (catRes.rows.length > 0) {
                        categoryId = catRes.rows[0].id
                    } else {
                        // Create new category
                        const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                        const newCatRes = await client.query(
                            'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
                            [categoryName, slug]
                        )
                        categoryId = newCatRes.rows[0].id
                    }
                }

                // Check if product exists (by model_name or model_no)
                // Prefer model_no if available, otherwise model_name
                let existingProduct = null
                if (modelNo) {
                    const checkRes = await client.query('SELECT id FROM products WHERE model_no = $1', [modelNo])
                    if (checkRes.rows.length > 0) existingProduct = checkRes.rows[0]
                }

                if (!existingProduct) {
                    const checkRes = await client.query('SELECT id FROM products WHERE model_name = $1', [modelName])
                    if (checkRes.rows.length > 0) existingProduct = checkRes.rows[0]
                }

                if (existingProduct) {
                    // Update
                    // Check mode
                    const mode = req.body.mode || 'all'
                    if (mode === 'new') {
                        // Skip update for existing product in 'new' mode
                        await client.query('RELEASE SAVEPOINT row_savepoint')
                        continue
                    }

                    await client.query(
                        `UPDATE products SET 
                            category_id = COALESCE($1, category_id),
                            brand = $2,
                            description = $3,
                            image_url = $4,
                            b2b_price = $5,
                            stock_quantity = $6,
                            detail_url = $7,
                            consumer_price = $8,
                            supply_price = $9,
                            quantity_per_carton = $10,
                            shipping_fee = $11,
                            manufacturer = $12,
                            origin = $13,
                            is_tax_free = $14,
                            shipping_fee_individual = $15,
                            shipping_fee_carton = $16,
                            product_options = $17,
                            model_no = $18,
                            product_spec = $19,
                            remarks = $20,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $21`,
                        [
                            categoryId, brand, description, imageUrl, b2bPrice, stockQuantity, finalDetailUrl,
                            consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin,
                            isTaxFree, shippingFeeIndividual, shippingFeeCarton, productOptions, modelNo, productSpec,
                            remarks, existingProduct.id
                        ]
                    )
                } else {
                    // Insert
                    // Check mode
                    const mode = req.body.mode || 'all'
                    if (mode === 'update') {
                        // Skip insert for new product in 'update' mode
                        await client.query('RELEASE SAVEPOINT row_savepoint')
                        continue
                    }

                    await client.query(
                        `INSERT INTO products (
                            category_id, brand, model_name, description, image_url, b2b_price, stock_quantity,
                            detail_url, consumer_price, supply_price, quantity_per_carton, shipping_fee,
                            manufacturer, origin, is_tax_free, shipping_fee_individual, shipping_fee_carton,
                            product_options, model_no, product_spec, remarks, is_available
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, true)`,
                        [
                            categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity,
                            finalDetailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee,
                            manufacturer, origin, isTaxFree, shippingFeeIndividual, shippingFeeCarton,
                            productOptions, modelNo, productSpec, remarks
                        ]
                    )
                }

                await client.query('RELEASE SAVEPOINT row_savepoint')
                successCount++
            } catch (err) {
                // Rollback to savepoint if error occurs for this row
                await client.query('ROLLBACK TO SAVEPOINT row_savepoint')
                console.error(`Error processing row ${index + 2}:`, err)
                errorCount++
                errors.push(`Row ${index + 2}: ${err.message}`)
            }
        }

        await client.query('COMMIT')
        res.json({
            message: 'Excel processing completed',
            success: successCount,
            failed: errorCount,
            errors: errors
        })

    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Excel upload error:', error)
        res.status(500).json({ error: 'Failed to process Excel file' })
    } finally {
        client.release()
    }
})

// Sync supply_price with consumer_price for existing products
router.post('/sync-prices', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query(`
            UPDATE products 
            SET supply_price = b2b_price 
            WHERE (supply_price = 0 OR supply_price IS NULL) 
            AND b2b_price > 0
        `)
        await client.query('COMMIT')
        res.json({ message: `Updated ${result.rowCount} products`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Sync prices error:', error)
        res.status(500).json({ error: 'Failed to sync prices' })
    } finally {
        client.release()
    }
})

// Sync shipping_fee_individual with shipping_fee
router.post('/sync-shipping', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee 
            WHERE (shipping_fee_individual = 0 OR shipping_fee_individual IS NULL) 
            AND shipping_fee > 0
        `)
        await client.query('COMMIT')
        res.json({ message: `Updated ${result.rowCount} products`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Sync shipping error:', error)
        res.status(500).json({ error: 'Failed to sync shipping' })
    } finally {
        client.release()
    }
})



// Swap b2b_price and consumer_price
router.post('/swap-prices', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        // Swap where b2b_price > consumer_price (assuming this indicates a swap error)
        const result = await client.query(`
            UPDATE products 
            SET b2b_price = consumer_price, consumer_price = b2b_price 
            WHERE b2b_price > consumer_price AND consumer_price > 0
        `)
        await client.query('COMMIT')
        res.json({ message: `Swapped prices for ${result.rowCount} products`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Swap prices error:', error)
        res.status(500).json({ error: 'Failed to swap prices' })
    } finally {
        client.release()
    }
})

// Comprehensive data fix
router.post('/fix-data', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1. Swap b2b_price and consumer_price where b2b_price > consumer_price
        const swapResult = await client.query(`
            UPDATE products 
            SET b2b_price = consumer_price, consumer_price = b2b_price 
            WHERE b2b_price > consumer_price AND consumer_price > 0
        `)

        // 2. Sync supply_price with b2b_price (Actual Sales Price)
        const supplyResult = await client.query(`
            UPDATE products 
            SET supply_price = b2b_price 
            WHERE (supply_price = 0 OR supply_price IS NULL) 
            AND b2b_price > 0
        `)

        // 3. Fix shipping_fee_individual (assuming < 100 is a parsing error like 3 -> 3000)
        const shippingResult = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee_individual * 1000 
            WHERE shipping_fee_individual > 0 AND shipping_fee_individual < 100
        `)

        // 4. Also ensure shipping_fee_individual is set from shipping_fee if 0
        const shippingSyncResult = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee 
            WHERE (shipping_fee_individual = 0 OR shipping_fee_individual IS NULL) 
            AND shipping_fee > 0
        `)

        await client.query('COMMIT')

        res.json({
            message: 'Data fix completed',
            swapped: swapResult.rowCount,
            syncedSupply: supplyResult.rowCount,
            fixedShipping: shippingResult.rowCount,
            syncedShipping: shippingSyncResult.rowCount
        })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Data fix error:', error)
        res.status(500).json({ error: 'Failed to fix data' })
    } finally {
        client.release()
    }
})

// Delete products by ID range (Maintenance)
router.delete('/range', async (req, res) => {
    const client = await pool.connect()
    try {
        const { startId, endId } = req.query

        if (!startId || !endId) {
            return res.status(400).json({ error: 'Start ID and End ID are required' })
        }

        await client.query('BEGIN')

        // Delete related quote items
        await client.query(`
            DELETE FROM quote_items 
            WHERE product_id IN (SELECT id FROM products WHERE id BETWEEN $1 AND $2)
        `, [startId, endId])

        // Delete products
        const result = await client.query(`
            DELETE FROM products 
            WHERE id BETWEEN $1 AND $2
        `, [startId, endId])

        await client.query('COMMIT')
        res.json({ message: `Deleted ${result.rowCount} products with ID between ${startId} and ${endId}`, count: result.rowCount })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Delete product range error:', error)
        res.status(500).json({ error: 'Failed to delete product range' })
    } finally {
        client.release()
    }
})

// Reset product ID sequence
router.post('/reset-sequence', async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // Get max ID
        const maxIdRes = await client.query('SELECT MAX(id) as max_id FROM products')
        const maxId = maxIdRes.rows[0].max_id || 0

        // Reset sequence
        // setval sets the current value, nextval will be maxId + 1
        await client.query("SELECT setval('products_id_seq', $1)", [maxId])

        await client.query('COMMIT')
        res.json({ message: `Sequence reset to ${maxId}. Next ID will be ${maxId + 1}.` })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Reset sequence error:', error)
        res.status(500).json({ error: 'Failed to reset sequence' })
    } finally {
        client.release()
    }
})

// Register products by row range (spawns Python script)
router.post('/register-range', async (req, res) => {
    const { startRow, endRow } = req.body

    if (!startRow || !endRow) {
        return res.status(400).json({ error: 'Start Row and End Row are required' })
    }

    try {
        const { spawn } = await import('child_process')
        // Path to python script
        const pythonScript = path.join(__dirname, '..', 'register_range_generic.py')

        // Spawn python process
        const pythonProcess = spawn('python3', [pythonScript, '--start', String(startRow), '--end', String(endRow)])

        let output = ''
        let errorOutput = ''

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString()
        })

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString()
        })

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ message: 'Range registration completed', output })
            } else {
                console.error(`Python script exited with code ${code}`)
                console.error(`Error output: ${errorOutput}`)
                res.status(500).json({ error: 'Range registration failed', details: errorOutput })
            }
        })

    } catch (error) {
        console.error('Register range error:', error)
        res.status(500).json({ error: 'Failed to initiate range registration' })
    }
})

// Update source Excel file (Overwrite master file)
router.post('/update-source', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }

    const targetDir = path.join(__dirname, '..', '..', 'excel')
    const targetPath = path.join(targetDir, 'aron_product_upload_consolidated.xlsx')

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
    }

    try {
        // Move/Overwrite file
        // Since mutation of req.file depends on storage, we used memory storage? 
        // Wait, upload.single('file') with default setup usually uses memory or temp.
        // Checking multer config above... usually it's declared but let's check.
        // Assuming req.file.buffer exists if memory storage, or path if disk.
        // Just defining writeFileSync is safest if buffer is available.

        fs.writeFileSync(targetPath, req.file.buffer)
        console.log(`Updated master Excel file at ${targetPath}`)
        res.json({ message: 'Server source Excel file updated successfully' })
    } catch (error) {
        console.error('Failed to update source excel:', error)
        res.status(500).json({ error: 'Failed to update source Excel file' })
    }
})

export default router
