
import pool from './config/database.js';

const migrateCategories = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get IDs
        const res = await client.query('SELECT id, name, slug FROM categories');
        const categories = res.rows;

        const fashion = categories.find(c => c.slug === 'fashion' || c.name === 'Fashion');
        const living = categories.find(c => c.slug.toLowerCase() === 'living' || c.name === 'Living');

        if (!fashion) {
            console.log('Fashion category not found, skipping migration.');
        } else if (!living) {
            console.log('Living category not found, cannot migrate.');
        } else {
            // 2. Move products from Fashion to Living
            console.log(`Moving products from Fashion (${fashion.id}) to Living (${living.id})...`);
            await client.query('UPDATE products SET category_id = $1 WHERE category_id = $2', [living.id, fashion.id]);

            // 3. Delete Fashion category
            console.log(`Deleting Fashion category (${fashion.id})...`);
            await client.query('DELETE FROM categories WHERE id = $1', [fashion.id]);
        }

        // 4. Ensure Living slug is lowercase
        if (living && living.slug !== 'living') {
            console.log('Updating Living slug to lowercase...');
            await client.query("UPDATE categories SET slug = 'living' WHERE id = $1", [living.id]);
        }

        // 5. Ensure all required categories exist and have correct slugs
        const requiredCategories = [
            { name: 'Audio', slug: 'audio', description: '스피커, 헤드폰, 이어폰 등' },
            { name: 'Living', slug: 'living', description: '생활용품 및 잡화' },
            { name: 'Mobile', slug: 'mobile', description: '휴대폰 액세서리 및 주변기기' },
            { name: 'Food', slug: 'food', description: '식품 및 음료' },
            { name: 'Beauty', slug: 'beauty', description: '미용 및 뷰티 제품' },
            { name: 'Other', slug: 'other', description: '기타 잡화' }
        ];

        for (const cat of requiredCategories) {
            const exists = await client.query('SELECT * FROM categories WHERE slug = $1', [cat.slug]);
            if (exists.rows.length === 0) {
                console.log(`Creating missing category: ${cat.name}`);
                await client.query('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', [cat.name, cat.slug, cat.description]);
            } else {
                // Update name/description just in case
                await client.query('UPDATE categories SET name = $1, description = $2 WHERE slug = $3', [cat.name, cat.description, cat.slug]);
            }
        }

        await client.query('COMMIT');
        console.log('Category migration completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error migrating categories:', error);
    } finally {
        client.release();
        process.exit();
    }
};

migrateCategories();
