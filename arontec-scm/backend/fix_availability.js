import pool from './config/database.js';

async function fix() {
    try {
        await pool.query('UPDATE products SET is_available = true WHERE is_available IS NULL OR is_available = false');
        console.log('Fixed is_available for existing products');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
