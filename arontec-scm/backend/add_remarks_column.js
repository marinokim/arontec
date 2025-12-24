import pool from './config/database.js';

const addRemarksColumn = async () => {
    try {
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS remarks TEXT;
        `);
        console.log('Successfully added remarks column to products table');
    } catch (error) {
        console.error('Error adding remarks column:', error);
    } finally {
        pool.end();
    }
};

addRemarksColumn();
