import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/arontec_scm',
    ssl: (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase'))
        ? { rejectUnauthorized: false }
        : false
})

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err)
    } else {
        console.log('✅ Database connected at:', res.rows[0].now)
    }
})

export default pool
