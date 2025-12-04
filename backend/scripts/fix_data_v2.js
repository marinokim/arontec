import pool from '../config/database.js'

const fixData = async () => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1. Swap b2b_price and consumer_price where b2b_price > consumer_price
        const swapResult = await client.query(`
            UPDATE products 
            SET b2b_price = consumer_price, consumer_price = b2b_price 
            WHERE b2b_price > consumer_price AND consumer_price > 0
        `)
        console.log(`Swapped prices for ${swapResult.rowCount} products.`)

        // 2. Sync supply_price with b2b_price (Actual Sales Price)
        const supplyResult = await client.query(`
            UPDATE products 
            SET supply_price = b2b_price 
            WHERE (supply_price = 0 OR supply_price IS NULL) 
            AND b2b_price > 0
        `)
        console.log(`Synced supply_price for ${supplyResult.rowCount} products.`)

        // 3. Fix shipping_fee_individual (assuming < 100 is a parsing error like 3 -> 3000)
        // Only update if it looks like a truncated value (e.g. 3, 4, 5)
        const shippingResult = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee_individual * 1000 
            WHERE shipping_fee_individual > 0 AND shipping_fee_individual < 100
        `)
        console.log(`Fixed shipping fees for ${shippingResult.rowCount} products.`)

        // 4. Also ensure shipping_fee_individual is set from shipping_fee if 0
        const shippingSyncResult = await client.query(`
            UPDATE products 
            SET shipping_fee_individual = shipping_fee 
            WHERE (shipping_fee_individual = 0 OR shipping_fee_individual IS NULL) 
            AND shipping_fee > 0
        `)
        console.log(`Synced shipping fees for ${shippingSyncResult.rowCount} products.`)

        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Data fix failed:', error)
    } finally {
        client.release()
        process.exit()
    }
}

fixData()
