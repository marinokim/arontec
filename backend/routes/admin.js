import express from 'express'
import pool from '../config/database.js'
import { requireAdmin } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'

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
        const userId = parseInt(req.params.id)

        // Delete quotes (will cascade to quote_items)
        // Note: carts and notifications have ON DELETE CASCADE in schema
        await client.query("DELETE FROM quotes WHERE user_id = $1", [userId])

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
        // Return detailed error for debugging
        res.status(500).json({ error: 'Failed to delete member: ' + error.message })
    } finally {
        client.release()
    }
}

// Register both POST and DELETE for deletion (for backward compatibility)
router.post('/members/:id/delete', requireAdmin, handleDelete)
router.delete('/members/:id', requireAdmin, handleDelete)

// Reset user password
router.post('/members/:id/reset-password', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id
        // Default password: user1111
        // We need bcrypt here. admin.js imports pool, express, requireAdmin.
        // We need to import bcrypt. But admin.js doesn't import it yet.
        // I will add the import at the top in a separate edit or assume I can add it here if I check imports.
        // Wait, I should verify imports first.
        // Assuming I will add 'import bcrypt from "bcryptjs"' at the top.

        // For now, I'll write the logic.
        const hash = await bcrypt.hash('user1111', 10)

        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND is_admin = false',
            [hash, userId]
        )

        res.json({ message: 'Password reset to user1111' })
    } catch (error) {
        console.error('Reset password error:', error)
        res.status(500).json({ error: 'Failed to reset password' })
    }
})

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
