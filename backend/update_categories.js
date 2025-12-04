import pool from './config/database.js';

const updates = [
    { id: 1, name: 'Audio', slug: 'audio' },
    { id: 2, name: 'Mobile', slug: 'mobile' },
    { id: 3, name: 'Beauty', slug: 'beauty' },
    { id: 4, name: 'Other', slug: 'other' }
];

const newCategories = [
    { name: 'Food', slug: 'food', description: 'Food and Beverages' }
];

async function update() {
    try {
        // Update existing
        for (const cat of updates) {
            await pool.query('UPDATE categories SET name = $1, slug = $2 WHERE id = $3', [cat.name, cat.slug, cat.id]);
            console.log(`Updated ID ${cat.id} to ${cat.name}`);
        }

        // Insert new
        for (const cat of newCategories) {
            // Check if exists first (by slug)
            const res = await pool.query('SELECT * FROM categories WHERE slug = $1', [cat.slug]);
            if (res.rows.length === 0) {
                await pool.query('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', [cat.name, cat.slug, cat.description]);
                console.log(`Inserted ${cat.name}`);
            } else {
                console.log(`${cat.name} already exists`);
            }
        }

        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

update();
