import express from 'express'
import pool from '../config/database.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Save proposal history
router.post('/', requireAuth, async (req, res) => {
    const { title, items } = req.body
    const userId = req.session.userId // Use session.userId instead of req.user.id

    try {
        const result = await pool.query(
            'INSERT INTO proposal_history (user_id, title, items) VALUES ($1, $2, $3) RETURNING *',
            [userId, title, JSON.stringify(items)]
        )
        res.json({ success: true, history: result.rows[0] })
    } catch (error) {
        console.error('Error saving proposal history:', error)
        res.status(500).json({ error: 'Failed to save proposal history' })
    }
})

// Get my proposal history
router.get('/my', requireAuth, async (req, res) => {
    const userId = req.session.userId

    try {
        const result = await pool.query(
            'SELECT * FROM proposal_history WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        )
        res.json({ history: result.rows })
    } catch (error) {
        console.error('Error fetching my proposal history:', error)
        res.status(500).json({ error: 'Failed to fetch proposal history' })
    }
})

// Get all proposal history (Admin only)
router.get('/all', requireAuth, requireAdmin, async (req, res) => {

    try {
        const result = await pool.query(`
            SELECT ph.*, u.email, u.company_name, u.contact_person as username 
            FROM proposal_history ph 
            JOIN users u ON ph.user_id = u.id 
            ORDER BY ph.created_at DESC
        `)
        res.json({ history: result.rows })
    } catch (error) {
        console.error('Error fetching all proposal history:', error)
        res.status(500).json({ error: 'Failed to fetch all proposal history' })
    }
})

export default router
