
import pool from './config/database.js';

async function check() {
    try {
        const res = await pool.query('SELECT id, model_name, detail_url FROM products ORDER BY updated_at DESC LIMIT 1');
        if (res.rows.length > 0) {
            const p = res.rows[0];
            console.log(`Product ID: ${p.id}`);
            console.log(`Model Name: ${p.model_name}`);
            console.log(`Detail URL Length: ${p.detail_url ? p.detail_url.length : 0}`);
            console.log(`Detail URL Content (first 500 chars):`);
            console.log(p.detail_url ? p.detail_url.substring(0, 500) : 'NULL');
            console.log(`Detail URL Content (last 500 chars):`);
            console.log(p.detail_url ? p.detail_url.substring(p.detail_url.length - 500) : 'NULL');
        } else {
            console.log('No products found');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
