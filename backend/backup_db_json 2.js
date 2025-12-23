
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import pool from './config/database.js';
console.log('Current directory:', process.cwd());
console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
} else {
    console.log('Using default connection string (localhost)');
}
console.log('Node ENV:', process.env.NODE_ENV);

const tables = [
    'users',
    'products',
    'categories',
    'carts',
    'quotes',
    'quote_items',
    'notifications',
    'proposal_history'
];

async function backup() {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
    const backupDir = path.join(__dirname, '..', 'db_backup');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup at ${new Date().toISOString()}...`);

    try {
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT * FROM ${table}`);
                const filename = `${table}_backup_${timestamp}.json`;
                const filepath = path.join(backupDir, filename);

                fs.writeFileSync(filepath, JSON.stringify(res.rows, null, 2));
                console.log(`Backed up ${table} to ${filename} (${res.rows.length} rows)`);
            } catch (err) {
                if (err.code === '42P01') {
                    console.warn(`Table ${table} does not exist, skipping.`);
                } else {
                    console.error(`Error backing up ${table}:`, err);
                }
            }
        }
        console.log('Backup completed successfully.');
    } catch (err) {
        console.error('Backup failed:', err);
    } finally {
        await pool.end();
    }
}

backup();
