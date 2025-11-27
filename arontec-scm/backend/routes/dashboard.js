import express from 'express'
import pool from '../config/database.js'
import { requireApproved } from '../middleware/auth.js'

const router = express.Router()

// Get dashboard data
router.get('/', requireApproved, async (req, res) => {
    try {
        // Get notifications
        const notificationsResult = await pool.query(`
      SELECT * FROM notifications 
      WHERE is_active = true 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

        // Get recent quotes
        const quotesResult = await pool.query(`
      SELECT * FROM quotes 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.session.userId])

        res.json({
            notifications: notificationsResult.rows,
            recentQuotes: quotesResult.rows
        })
    } catch (error) {
        console.error('Get dashboard error:', error)
        res.status(500).json({ error: 'Failed to get dashboard data' })
    }
})

export default router
