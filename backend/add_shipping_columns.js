import pool from './config/database.js'

const addShippingColumns = async () => {
    try {
        await pool.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
            ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP
        `)
        console.log('Shipping columns added successfully')
    } catch (error) {
        console.error('Error adding columns:', error)
    } finally {
        await pool.end()
    }
}

addShippingColumns()
