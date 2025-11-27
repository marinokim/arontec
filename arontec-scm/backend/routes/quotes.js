import express from 'express'
import pool from '../config/database.js'
import { requireApproved, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Create quote from cart
router.post('/', requireApproved, async (req, res) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const { deliveryDate, notes } = req.body

        // Generate quote number
        const quoteNumber = `Q${Date.now()}`

        // Get cart items
        const cartResult = await client.query(`
      SELECT c.*, p.b2b_price
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `, [req.session.userId])

        if (cartResult.rows.length === 0) {
            throw new Error('장바구니가 비어있습니다')
        }

        // Calculate total
        const totalAmount = cartResult.rows.reduce((sum, item) => {
            return sum + (item.b2b_price * item.quantity)
        }, 0)

        // Create quote
        const quoteResult = await client.query(`
      INSERT INTO quotes (user_id, quote_number, delivery_date, notes, total_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.session.userId, quoteNumber, deliveryDate, notes, totalAmount])

        const quoteId = quoteResult.rows[0].id

        // Create quote items
        for (const item of cartResult.rows) {
            await client.query(`
        INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [quoteId, item.product_id, item.quantity, item.b2b_price, item.b2b_price * item.quantity])
        }

        // Clear cart
        await client.query('DELETE FROM carts WHERE user_id = $1', [req.session.userId])

        await client.query('COMMIT')

        res.json({ message: '견적 요청이 완료되었습니다', quote: quoteResult.rows[0] })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Create quote error:', error)
        res.status(500).json({ error: error.message || 'Failed to create quote' })
    } finally {
        client.release()
    }
})

// Get my quotes
router.get('/', requireApproved, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM quotes
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.session.userId])

        res.json({ quotes: result.rows })
    } catch (error) {
        console.error('Get quotes error:', error)
        res.status(500).json({ error: 'Failed to get quotes' })
    }
})

// Get quote details
router.get('/:id', requireApproved, async (req, res) => {
    try {
        const quoteResult = await pool.query('SELECT * FROM quotes WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId])

        if (quoteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' })
        }

        const itemsResult = await pool.query(`
      SELECT qi.*, p.brand, p.model_name
      FROM quote_items qi
      JOIN products p ON qi.product_id = p.id
      WHERE qi.quote_id = $1
    `, [req.params.id])

        res.json({
            quote: quoteResult.rows[0],
            items: itemsResult.rows
        })
    } catch (error) {
        console.error('Get quote details error:', error)
        res.status(500).json({ error: 'Failed to get quote details' })
    }
})

// Update shipping info (Admin only)
router.put('/:id/shipping', requireAdmin, async (req, res) => {
    const client = await pool.connect()
    try {
        const { carrier, trackingNumber } = req.body

        await client.query('BEGIN')

        const result = await client.query(`
            UPDATE quotes 
            SET carrier = $1, 
                tracking_number = $2, 
                shipped_at = NOW(),
                status = 'shipped'
            WHERE id = $3
            RETURNING *
        `, [carrier, trackingNumber, req.params.id])

        if (result.rows.length === 0) {
            throw new Error('Quote not found')
        }

        await client.query('COMMIT')
        res.json({ message: 'Shipping info updated', quote: result.rows[0] })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Update shipping error:', error)
        res.status(500).json({ error: error.message })
    } finally {
        client.release()
    }
})

export default router
