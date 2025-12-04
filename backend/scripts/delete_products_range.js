import pool from '../config/database.js'

const deleteRange = async () => {
    const client = await pool.connect()
    try {
        const startId = 603
        const endId = 885

        console.log(`Deleting products with ID between ${startId} and ${endId}...`)

        await client.query('BEGIN')

        // Delete related quote items first
        const quoteDeleteRes = await client.query(`
            DELETE FROM quote_items 
            WHERE product_id IN (SELECT id FROM products WHERE id BETWEEN $1 AND $2)
        `, [startId, endId])
        console.log(`Deleted ${quoteDeleteRes.rowCount} related quote items.`)

        // Delete products
        const productDeleteRes = await client.query(`
            DELETE FROM products 
            WHERE id BETWEEN $1 AND $2
        `, [startId, endId])
        console.log(`Deleted ${productDeleteRes.rowCount} products.`)

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Deletion failed:', error)
    } finally {
        client.release()
        process.exit()
    }
}

deleteRange()
