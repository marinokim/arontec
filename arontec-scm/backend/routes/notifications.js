
import express from 'express'
import pool from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get all notifications (Public/Protected - filters active by default for non-admins if needed, but here we return all for admin and active for public)
router.get('/', async (req, res) => {
    try {
        const { isAdmin } = req.query
        let query = 'SELECT * FROM notifications ORDER BY created_at DESC'

        // If needed, we can filter for non-admins, but usually frontend handles display
        // For now, return all and let frontend decide based on is_active

        const result = await pool.query(query)
        res.json(result.rows)
    } catch (error) {
        console.error('Get notifications error:', error)
        res.status(500).json({ error: 'Failed to fetch notifications' })
    }
})

// Create notification (Admin only)
router.post('/', requireAdmin, async (req, res) => {
    const { title, content, is_active } = req.body
    try {
        const result = await pool.query(
            'INSERT INTO notifications (title, content, is_active) VALUES ($1, $2, $3) RETURNING *',
            [title, content, is_active !== undefined ? is_active : true]
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error('Create notification error:', error)
        res.status(500).json({ error: 'Failed to create notification' })
    }
})

// Update notification (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params
    const { title, content, is_active } = req.body
    try {
        const result = await pool.query(
            'UPDATE notifications SET title = $1, content = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [title, content, is_active, id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' })
        }
        res.json(result.rows[0])
    } catch (error) {
        console.error('Update notification error:', error)
        res.status(500).json({ error: 'Failed to update notification' })
    }
})

// Delete notification (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING id', [id])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' })
        }
        res.json({ message: 'Notification deleted successfully' })
    } catch (error) {
        console.error('Delete notification error:', error)
        res.status(500).json({ error: 'Failed to delete notification' })
    }
})

export default router
