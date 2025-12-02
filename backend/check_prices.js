
import pool from './config/database.js';

const checkPrices = async () => {
    const client = await pool.connect();
    try {
        console.log('Connected to database...');
        const res = await client.query('SELECT id, model_name, consumer_price, supply_price, b2b_price FROM products WHERE consumer_price > 1000000 OR supply_price > 1000000 OR b2b_price > 1000000');

        console.log(`Found ${res.rows.length} products with high prices:`);
        res.rows.forEach(p => {
            console.log(`ID: ${p.id}, Model: ${p.model_name}`);
            console.log(`  Consumer: ${p.consumer_price}`);
            console.log(`  Supply: ${p.supply_price}`);
            console.log(`  B2B: ${p.b2b_price}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error checking prices:', error);
    } finally {
        client.release();
        process.exit();
    }
};

checkPrices();
