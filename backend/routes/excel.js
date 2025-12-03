import express from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import pool from '../config/database.js'

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
                // Map Excel columns to DB fields
                // Expected columns: Brand, ModelName, ModelNo, Category, Description, B2BPrice, ConsumerPrice, Stock, ImageURL, DetailURL, Manufacturer, Origin, ProductSpec, ProductOptions

                const brand = sanitize(row['Brand'] || row['브랜드'])
                const modelName = sanitize(row['ModelName'] || row['모델명'])
                const modelNo = sanitize(row['ModelNo'] || row['모델번호'])
                const categoryName = sanitize(row['Category'] || row['카테고리'])
                const description = sanitize(row['Description'] || row['상세설명'])
                // Swapped mapping based on user feedback
                const b2bPrice = parsePrice(row['B2BPrice'] || row['소비자가'] || row['B2B가'])
                const consumerPrice = parsePrice(row['ConsumerPrice'] || row['공급가'])
                let supplyPrice = parsePrice(row['SupplyPrice'] || row['매입가'] || 0)

                // If supplyPrice is not provided (0), use b2bPrice (실판매가)
                if (supplyPrice === 0 && b2bPrice > 0) {
                    supplyPrice = b2bPrice
                }
                const stockQuantity = parsePrice(row['Stock'] || row['재고'])
                const imageUrl = sanitize(row['ImageURL'] || row['이미지URL'])
                const detailUrl = sanitize(row['DetailURL'] || row['상세페이지URL'])
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
                            categoryId, brand, description, imageUrl, b2bPrice, stockQuantity, detailUrl,
                            consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin,
                            isTaxFree, shippingFeeIndividual, shippingFeeCarton, productOptions, modelNo, productSpec,
                            remarks, existingProduct.id
                        ]
                    )
                } else {
                    // Insert
                    await client.query(
                        `INSERT INTO products (
                            category_id, brand, model_name, description, image_url, b2b_price, stock_quantity,
                            detail_url, consumer_price, supply_price, quantity_per_carton, shipping_fee,
                            manufacturer, origin, is_tax_free, shipping_fee_individual, shipping_fee_carton,
                            product_options, model_no, product_spec, remarks, is_available
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, true)`,
                        [
                            categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity,
                            detailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee,
                            manufacturer, origin, isTaxFree, shippingFeeIndividual, shippingFeeCarton,
                            productOptions, modelNo, productSpec, remarks
                        ]
                    )
                }

                successCount++
            } catch (err) {
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

export default router
