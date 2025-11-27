import express from 'express'
import pool from '../config/database.js'
import { requireApproved, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Create product (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, detailUrl, isAvailable } = req.body

        const result = await pool.query(
            `INSERT INTO products (category_id, brand, model_name, description, image_url, b2b_price, stock_quantity, detail_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, detailUrl, isAvailable !== undefined ? isAvailable : true]
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
        const { categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, isAvailable, detailUrl } = req.body

        const result = await pool.query(
            `UPDATE products 
       SET category_id = $1, brand = $2, model_name = $3, description = $4, 
           image_url = $5, b2b_price = $6, stock_quantity = $7, is_available = $8, detail_url = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
            [categoryId, brand, modelName, description, imageUrl, b2bPrice, stockQuantity, isAvailable, detailUrl, req.params.id]
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
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' })
        }

        res.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Delete product error:', error)
        res.status(500).json({ error: 'Failed to delete product' })
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
