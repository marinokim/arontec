import express from 'express'
import pool from '../config/database.js'
import { requireApproved, requireAdmin } from '../middleware/auth.js'
import { Buffer } from 'node:buffer'

const router = express.Router()

// Create product (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, detailUrl, isAvailable, consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin, isTaxFree, shippingFeeIndividual, shippingFeeCarton, productOptions, modelNo, remarks } = req.body

        const result = await pool.query(
            `INSERT INTO products (category_id, brand, model_name, description, image_url, b2b_price, stock_quantity, detail_url, is_available, consumer_price, supply_price, quantity_per_carton, shipping_fee, manufacturer, origin, is_tax_free, shipping_fee_individual, shipping_fee_carton, product_options, model_no, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
            [categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, detailUrl, isAvailable !== undefined ? isAvailable : true, consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin, isTaxFree || false, shippingFeeIndividual || 0, shippingFeeCarton || 0, productOptions || '', modelNo || '', remarks || '']
        )

        res.status(201).json({ product: result.rows[0] })
    } catch (error) {
        console.error('Create product error:', error)
        res.status(500).json({ error: 'Failed to create product' })
    }
})

// Update product (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, isAvailable, detailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin, isTaxFree, shippingFeeIndividual, shippingFeeCarton, productOptions, modelNo, remarks } = req.body

        const result = await pool.query(
            `UPDATE products 
       SET category_id = $1, brand = $2, model_name = $3, description = $4, 
           image_url = $5, b2b_price = $6, stock_quantity = $7, is_available = $8, detail_url = $9, 
           consumer_price = $10, supply_price = $11, quantity_per_carton = $12, shipping_fee = $13,
           manufacturer = $14, origin = $15, is_tax_free = $16,
           shipping_fee_individual = $17, shipping_fee_carton = $18, product_options = $19, model_no = $20,
           remarks = $21,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $22
       RETURNING *`,
            [categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, isAvailable, detailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee, manufacturer, origin, isTaxFree, shippingFeeIndividual, shippingFeeCarton, productOptions, modelNo, remarks, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' })
        }

        res.json({ product: result.rows[0] })
    } catch (error) {
        console.error('Update product error:', error)
        res.status(500).json({ error: 'Failed to update product' })
    }
})

// Toggle product availability (Admin only)
router.patch('/:id/availability', requireAdmin, async (req, res) => {
    try {
        const { isAvailable } = req.body

        const result = await pool.query(
            'UPDATE products SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [isAvailable, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' })
        }

        res.json({ product: result.rows[0] })
    } catch (error) {
        console.error('Toggle availability error:', error)
        res.status(500).json({ error: 'Failed to update availability' })
    }
})

// Delete product (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // Delete related quote items first (referential integrity)
        await client.query('DELETE FROM quote_items WHERE product_id = $1', [req.params.id])

        // Delete the product
        const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'Product not found' })
        }

        await client.query('COMMIT')
        res.json({ message: 'Product deleted successfully' })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Delete product error:', error)
        res.status(500).json({ error: 'Failed to delete product' })
    } finally {
        client.release()
    }
})

// Get all products with optional category filter (Public)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query

        let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = true
    `
        const params = []

        if (category) {
            params.push(category)
            query += ` AND c.slug = $${params.length}`
        }

        if (search) {
            params.push(`%${search}%`)
            query += ` AND (p.brand ILIKE $${params.length} OR p.model_name ILIKE $${params.length})`
        }

        query += ' ORDER BY p.created_at DESC'

        const result = await pool.query(query, params)
        res.json({ products: result.rows })
    } catch (error) {
        console.error('Get products error:', error)
        res.status(500).json({ error: 'Failed to get products' })
    }
})

// Get all categories (Public)
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY id')
        res.json({ categories: result.rows })
    } catch (error) {
        console.error('Get categories error:', error)
        res.status(500).json({ error: 'Failed to fetch categories' })
    }
})

// Create category
router.post('/categories', requireAdmin, async (req, res) => {
    const { name } = req.body
    try {
        // Generate slug: lowercase, replace spaces with hyphens, remove special chars
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

        const result = await pool.query(
            'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
            [name, slug]
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error('Create category error:', error)
        res.status(500).json({ error: 'Failed to create category' })
    }
})

// Get all unique brands (Public)
router.get('/brands', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != \'\' ORDER BY brand')
        res.json({ brands: result.rows.map(row => row.brand) })
    } catch (error) {
        console.error('Get brands error:', error)
        res.status(500).json({ error: 'Failed to get brands' })
    }
})

// Get all unique manufacturers (Public)
router.get('/manufacturers', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT manufacturer FROM products WHERE manufacturer IS NOT NULL AND manufacturer != \'\' ORDER BY manufacturer')
        res.json({ manufacturers: result.rows.map(row => row.manufacturer) })
    } catch (error) {
        console.error('Get manufacturers error:', error)
        res.status(500).json({ error: 'Failed to get manufacturers' })
    }
})

// Get all unique origins (Public)
router.get('/origins', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT origin FROM products WHERE origin IS NOT NULL AND origin != \'\' ORDER BY origin')
        res.json({ origins: result.rows.map(row => row.origin) })
    } catch (error) {
        console.error('Get origins error:', error)
        res.status(500).json({ error: 'Failed to get origins' })
    }
})

// Proxy image endpoint to bypass CORS
router.get('/proxy-image', async (req, res) => {
    const { url } = req.query
    if (!url) {
        return res.status(400).json({ error: 'URL is required' })
    }

    const fetchImage = async (targetUrl) => {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': new URL(targetUrl).origin
            }
        })
        return response
    }

    try {
        let response
        try {
            response = await fetchImage(url)
        } catch (err) {
            console.warn(`First attempt failed for ${url}:`, err.message)
            // If HTTPS fails, try HTTP
            if (url.startsWith('https://')) {
                const httpUrl = url.replace('https://', 'http://')
                console.log(`Retrying with HTTP: ${httpUrl}`)
                response = await fetchImage(httpUrl)
            } else {
                throw err
            }
        }

        if (!response.ok) {
            console.error(`Proxy fetch failed: ${response.status} ${response.statusText} for ${url}`)
            return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` })
        }

        const contentType = response.headers.get('content-type')
        if (contentType) {
            res.setHeader('Content-Type', contentType)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        res.send(buffer)

    } catch (error) {
        console.error('Proxy image error:', error)
        res.status(500).json({ error: `Internal server error: ${error.message}` })
    }
})

// Get single product (Public)
router.get('/:id(\\d+)', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.name as category_name 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = $1`,
            [req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' })
        }

        res.json({ product: result.rows[0] })
    } catch (error) {
        console.error('Get product error:', error)
        res.status(500).json({ error: 'Failed to get product' })
    }
})



export default router
