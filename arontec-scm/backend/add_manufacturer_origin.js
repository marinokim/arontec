
import pool from './config/database.js'

const addColumns = async () => {
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

            await client.query('COMMIT')
            console.log('Successfully added manufacturer and origin columns')
        } catch (error) {
            await client.query('ROLLBACK')
            console.error('Error adding columns:', error)
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('Database connection error:', error)
    } finally {
        await pool.end()
    }
}

addColumns()
