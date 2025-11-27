import pool from './config/database.js';

async function addFashion() {
    try {
        // Check if exists
        const check = await pool.query("SELECT * FROM categories WHERE name = 'Fashion'");
        if (check.rows.length > 0) {
            console.log('Fashion category already exists');
        } else {
            await pool.query("INSERT INTO categories (name, slug, description) VALUES ('Fashion', 'fashion', '패션 의류 및 잡화')");
            console.log('Added Fashion category');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

addFashion();
