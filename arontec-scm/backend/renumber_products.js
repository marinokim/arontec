
import pool from './config/database.js';

const renumberProducts = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get all products ordered by created_at (or id)
        const res = await client.query('SELECT id FROM products ORDER BY id');
        const products = res.rows;

        console.log(`Found ${products.length} products to renumber.`);

        // 2. Update IDs sequentially
        // We use a temporary mapping to avoid collisions if we were swapping IDs, 
        // but here we likely just want to squash gaps. 
        // To be safe against unique constraint violations (e.g. if we have 1, 2, 30 and want 1, 2, 3),
        // we should handle it carefully. 
        // Simplest way for sparse -> dense is just update if target is free.
        // But if we have 1, 30 and want 1, 2. 1 is already 1. 30 becomes 2.

        let newId = 1;
        for (const product of products) {
            const oldId = product.id;

            if (oldId === newId) {
                console.log(`Product ${oldId} is already at ID ${newId}. Skipping.`);
                newId++;
                continue;
            }

            console.log(`Renumbering Product ${oldId} -> ${newId}`);

            // Update dependencies first (if constraints are deferred, or if we update parent first? 
            // Postgres enforces constraints immediately by default. 
            // If we update Parent ID, children become orphans unless we update them too or have CASCADE.
            // We don't have CASCADE on UPDATE for these FKs in the dump.
            // So we MUST create new parent or defer constraints. 
            // Actually, we can't update parent ID if children exist without deferring or dropping constraint.
            // OR: We set constraints to DEFERRED if they are deferrable. 
            // Checking schema: "ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... ;" usually not deferrable unless specified.

            // Strategy:
            // 1. Disable triggers/constraints? Dangerous.
            // 2. "Smart" update: 
            //    a. Insert new product with new ID (copy of old).
            //    b. Update children to point to new ID.
            //    c. Delete old product.

            // Let's try the Copy-Update-Delete approach.

            // A. Get full product data
            const pRes = await client.query('SELECT * FROM products WHERE id = $1', [oldId]);
            const pData = pRes.rows[0];

            // B. Insert as new ID (we need to force ID insertion)
            // Note: We can't easily "force" ID in INSERT if we use DEFAULT nextval, but we can specify it.
            // But wait, if we insert ID 1, and ID 1 exists (it shouldn't if we check), it works.

            // Check if target ID exists (it shouldn't if we iterate 1..N and current is > N)
            // But if we have 1, 30. newId=1. oldId=1. Skipped.
            // newId=2. oldId=30. Target 2 is free.

            // Insert copy with new ID
            const columns = Object.keys(pData).filter(k => k !== 'id').join(', ');
            const values = Object.values(pData).filter((_, i) => Object.keys(pData)[i] !== 'id');
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

            // We need to explicitly insert the ID
            await client.query(
                `INSERT INTO products (id, ${columns}) VALUES ($${values.length + 1}, ${placeholders})`,
                [...values, newId]
            );

            // C. Update dependencies
            await client.query('UPDATE carts SET product_id = $1 WHERE product_id = $2', [newId, oldId]);
            await client.query('UPDATE quote_items SET product_id = $1 WHERE product_id = $2', [newId, oldId]);

            // D. Delete old product
            await client.query('DELETE FROM products WHERE id = $1', [oldId]);

            newId++;
        }

        // 3. Reset sequence
        // Get max ID
        const maxRes = await client.query('SELECT MAX(id) as max_id FROM products');
        const maxId = maxRes.rows[0].max_id || 0;
        const nextSeq = parseInt(maxId) + 1;

        console.log(`Resetting sequence to ${nextSeq}`);
        await client.query('ALTER SEQUENCE products_id_seq RESTART WITH ' + nextSeq);

        await client.query('COMMIT');
        console.log('Renumbering completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error renumbering products:', error);
    } finally {
        client.release();
        process.exit();
    }
};

renumberProducts();
