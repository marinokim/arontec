import express from 'express'
import pool from '../config/database.js'
import { requireApproved } from '../middleware/auth.js'

const router = express.Router()

// Get cart items
router.get('/', requireApproved, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT c.*, p.brand, p.model_name, p.b2b_price, p.image_url
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [req.session.userId])

        res.json({ cart: result.rows })
    } catch (error) {
        console.error('Get cart error:', error)
        res.status(500).json({ error: 'Failed to get cart' })
    }
})

// Add to cart
router.post('/', requireApproved, async (req, res) => {
    try {
        const { productId, quantity = 1, option = '' } = req.body

        const result = await pool.query(`
      INSERT INTO carts (user_id, product_id, quantity, option)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, product_id, option)
      DO UPDATE SET quantity = carts.quantity + $3
      RETURNING *
    `, [req.session.userId, productId, quantity, option])

        res.json({ message: '장바구니에 추가되었습니다', item: result.rows[0] })
    } catch (error) {
        console.error('Add to cart error:', error)
        res.status(500).json({ error: 'Failed to add to cart' })
    }
})

// Update cart item quantity
router.put('/:id', requireApproved, async (req, res) => {
    try {
        const { quantity } = req.body

        const result = await pool.query(`
      UPDATE carts 
      SET quantity = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [quantity, req.params.id, req.session.userId])

        res.json({ item: result.rows[0] })
    } catch (error) {
        console.error('Update cart error:', error)
        res.status(500).json({ error: 'Failed to update cart' })
    }
})

// Remove from cart
router.delete('/:id', requireApproved, async (req, res) => {
    try {
        await pool.query('DELETE FROM carts WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId])
        res.json({ message: '삭제되었습니다' })
    } catch (error) {
        console.error('Delete cart error:', error)
        res.status(500).json({ error: 'Failed to delete from cart' })
    }
})

export default router
