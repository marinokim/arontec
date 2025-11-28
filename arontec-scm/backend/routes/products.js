import express from 'express'
import pool from '../config/database.js'
import { requireApproved, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Create product (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, detailUrl, isAvailable, consumerPrice, supplyPrice, quantityPerCarton, shippingFee } = req.body

        const result = await pool.query(
            `INSERT INTO products (category_id, brand, model_name, description, image_url, b2b_price, stock_quantity, detail_url, is_available, consumer_price, supply_price, quantity_per_carton, shipping_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
            [categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, detailUrl, isAvailable !== undefined ? isAvailable : true, consumerPrice, supplyPrice, quantityPerCarton, shippingFee]
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
        const { categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, isAvailable, detailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee } = req.body

        const result = await pool.query(
            `UPDATE products 
       SET category_id = $1, brand = $2, model_name = $3, description = $4, 
           image_url = $5, b2b_price = $6, stock_quantity = $7, is_available = $8, detail_url = $9, 
           consumer_price = $10, supply_price = $11, quantity_per_carton = $12, shipping_fee = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
            [categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, isAvailable, detailUrl, consumerPrice, supplyPrice, quantityPerCarton, shippingFee, req.params.id]
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
        const result = await pool.query('SELECT * FROM categories ORDER BY name')
        res.json({ categories: result.rows })
    } catch (error) {
        console.error('Get categories error:', error)
        res.status(500).json({ error: 'Failed to get categories' })
    }
})

// Get all unique brands (Public)
router.get('/brands', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT brand FROM products ORDER BY brand')
        res.json({ brands: result.rows.map(row => row.brand) })
    } catch (error) {
        console.error('Get brands error:', error)
        res.status(500).json({ error: 'Failed to get brands' })
    }
})

// Get single product (Public)
router.get('/:id', async (req, res) => {
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
