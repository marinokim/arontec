import pool from './config/database.js';

async function migrate() {
    try {
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_url TEXT');
        console.log('Added detail_url column to products table');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
