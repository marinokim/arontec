
import pool from './config/database.js';

const listCategories = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM categories ORDER BY id');
        console.log('Current Categories:', res.rows);
    } catch (error) {
        console.error('Error listing categories:', error);
    } finally {
        client.release();
        process.exit();
    }
};

listCategories();
