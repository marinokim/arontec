import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportProducts() {
    try {
        const result = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_available = true
            ORDER BY p.id DESC
        `);

        const products = result.rows.map(p => {
            // Map to frontend format
            const category = p.category_name || 'Other';

            return {
                id: p.id,
                brand: p.brand,
                model: p.model_name,
                description: p.description,
                price: Number(p.b2b_price),
                category: category,
                image: p.image_url,
                detailUrl: p.detail_url
            };
        });

        const fileContent = `const products = ${JSON.stringify(products, null, 2)};`;
        const outputPath = path.join(__dirname, '../../arontec-homepage/products_data.js');

        fs.writeFileSync(outputPath, fileContent);
        console.log(`Successfully exported ${products.length} products to ${outputPath}`);
        process.exit(0);
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
}

exportProducts();
