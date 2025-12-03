import express from 'express'
import pool from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get admin dashboard stats
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const pendingMembers = await pool.query('SELECT COUNT(*) FROM users WHERE is_approved = false AND is_admin = false')
        const pendingQuotes = await pool.query("SELECT COUNT(*) FROM quotes WHERE status = 'pending'")
        const lowStockProducts = await pool.query('SELECT COUNT(*) FROM products WHERE stock_quantity < 10')

        res.json({
            pendingMembers: parseInt(pendingMembers.rows[0].count),
            pendingQuotes: parseInt(pendingQuotes.rows[0].count),
            lowStockProducts: parseInt(lowStockProducts.rows[0].count)
        })
    } catch (error) {
        console.error('Get admin stats error:', error)
        res.status(500).json({ error: 'Failed to get admin stats' })
    }
})

// Get all users (members)
router.get('/members', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, email, company_name, contact_person, phone, business_number, is_approved, created_at
      FROM users
      WHERE is_admin = false
      ORDER BY created_at DESC
    `)

        res.json({ members: result.rows })
    } catch (error) {
        console.error('Get members error:', error)
        res.status(500).json({ error: 'Failed to get members' })
    }
})

// Approve/reject member handler
const handleApproval = async (req, res) => {
    try {
        const { isApproved } = req.body

        const result = await pool.query(`
      UPDATE users
      SET is_approved = $1
      WHERE id = $2 AND is_admin = false
      RETURNING id, email, company_name, is_approved
    `, [isApproved, req.params.id])

        res.json({ member: result.rows[0] })
    } catch (error) {
        console.error('Update approval error:', error)
        res.status(500).json({ error: 'Failed to update approval' })
    }
}

// Register both POST and PUT for approval (for backward compatibility)
router.post('/members/:id/approve', requireAdmin, handleApproval)
router.put('/members/:id/approval', requireAdmin, handleApproval)

// Delete member handler
const handleDelete = async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const userId = req.params.id

        // Delete related data first
        await client.query("DELETE FROM quote_items WHERE quote_id IN (SELECT id FROM quotes WHERE user_id = $1)", [userId])
        await client.query("DELETE FROM quotes WHERE user_id = $1", [userId])
        await client.query("DELETE FROM carts WHERE user_id = $1", [userId])
        await client.query("DELETE FROM notifications WHERE user_id = $1", [userId])

        // Delete user
        const result = await client.query('DELETE FROM users WHERE id = $1 AND is_admin = false RETURNING id', [userId])

        if (result.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'User not found or is admin' })
        }

        await client.query('COMMIT')
        res.json({ message: 'User deleted successfully' })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Delete member error:', error)
        res.status(500).json({ error: 'Failed to delete member' })
    } finally {
        client.release()
    }
}

// Register both POST and DELETE for deletion (for backward compatibility)
router.post('/members/:id/delete', requireAdmin, handleDelete)
router.delete('/members/:id', requireAdmin, handleDelete)

// Get all quotes
router.get('/quotes', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT q.*, u.company_name, u.contact_person
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
    `)

        res.json({ quotes: result.rows })
    } catch (error) {
        console.error('Get all quotes error:', error)
        res.status(500).json({ error: 'Failed to get quotes' })
    }
})

// Update quote status
router.put('/quotes/:id', requireAdmin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body

        const result = await pool.query(`
      UPDATE quotes
      SET status = $1, admin_notes = $2
      WHERE id = $3
      RETURNING *
    `, [status, adminNotes, req.params.id])

        res.json({ quote: result.rows[0] })
    } catch (error) {
        console.error('Update quote error:', error)
        res.status(500).json({ error: 'Failed to update quote' })
    }
})

export default router
