import pool from './config/database.js'

const addLivingCategory = async () => {
    try {
        const result = await pool.query(
            `INSERT INTO categories (name, slug, description) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (slug) DO NOTHING
             RETURNING *`,
            ['Living', 'Living', 'Home & Living Products']
        )

        if (result.rows.length > 0) {
            console.log('Successfully added Living category:', result.rows[0])
        } else {
            console.log('Living category already exists.')
        }
    } catch (error) {
        console.error('Error adding category:', error)
    } finally {
        await pool.end()
    }
}

addLivingCategory()
