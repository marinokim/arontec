import express from 'express'
import bcrypt from 'bcryptjs'
import pool from '../config/database.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, companyName, contactPerson, phone, businessNumber } = req.body

        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: '이미 등록된 이메일입니다' })
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, company_name, contact_person, phone, business_number) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, company_name`,
            [email, passwordHash, companyName, contactPerson, phone, businessNumber]
        )

        res.status(201).json({
            message: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
            user: result.rows[0]
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ error: '회원가입 중 오류가 발생했습니다' })
    }
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // Get user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        const user = result.rows[0]

        if (!user) {
            return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다' })
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
            return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다' })
        }

        // Check if approved
        if (!user.is_approved) {
            return res.status(403).json({ error: '관리자 승인 대기중입니다' })
        }

        // Set session
        req.session.userId = user.id
        req.session.email = user.email
        req.session.isAdmin = user.is_admin
        req.session.isApproved = user.is_approved

        res.json({
            message: '로그인 성공',
            user: {
                id: user.id,
                email: user.email,
                companyName: user.company_name,
                contactPerson: user.contact_person,
                isAdmin: user.is_admin
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: '로그인 중 오류가 발생했습니다' })
    }
})

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy()
    res.json({ message: '로그아웃 되었습니다' })
})

// Get current user
router.get('/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    try {
        const result = await pool.query(
            'SELECT id, email, company_name, contact_person, is_admin FROM users WHERE id = $1',
            [req.session.userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        const user = result.rows[0]
        res.json({
            user: {
                id: user.id,
                email: user.email,
                companyName: user.company_name,
                contactPerson: user.contact_person,
                isAdmin: user.is_admin
            }
        })
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({ error: 'Failed to get user' })
    }
})

export default router
