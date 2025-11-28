
import pool from './config/database.js'

export const runMigrations = async () => {
    try {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            // Add manufacturer column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'manufacturer') THEN 
                        ALTER TABLE products ADD COLUMN manufacturer VARCHAR(255); 
                    END IF; 
                END $$;
            `)

            // Add origin column
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'origin') THEN 
                        ALTER TABLE products ADD COLUMN origin VARCHAR(255); 
                    END IF; 
                END $$;
            `)

            // Add slug column to categories if missing
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN 
                        ALTER TABLE categories ADD COLUMN slug VARCHAR(100); 
                        UPDATE categories SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
                        ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
                        ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
                    END IF; 
                END $$;
            `)

            await client.query('COMMIT')
            console.log('✅ Database migrations completed successfully')
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('❌ Migration error:', error)
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('❌ Database connection error during migration:', error)
    }
}
