import pool from '../config/database.js'

const migrate = async () => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // Update supply_price to consumer_price where supply_price is 0 or NULL
        const result = await client.query(`
            UPDATE products 
            SET supply_price = consumer_price 
            WHERE (supply_price = 0 OR supply_price IS NULL) 
            AND consumer_price > 0
        `)

        console.log(`Updated ${result.rowCount} products.`)

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Migration failed:', error)
    } finally {
        client.release()
        process.exit()
    }
}

migrate()
