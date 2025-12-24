
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.zgqnhbaztgpekerhxwbc:gmlrhks0528%26%2A@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function fixUsers() {
    try {
        console.log("Connecting to DB...");

        // 1. Normalize Business Numbers
        console.log("Normalizing business numbers...");
        await pool.query("UPDATE users SET business_number = REPLACE(business_number, '-', '') WHERE business_number LIKE '%-%'");

        // 2. Find MindK and Reset
        console.log("Finding 'MindK'...");
        const res = await pool.query("SELECT id, email, company_name, business_number FROM users WHERE company_name LIKE '%마인드케이%' OR company_name LIKE '%MindK%'");

        if (res.rows.length === 0) {
            console.log("MindK user not found.");
        } else {
            for (let user of res.rows) {
                console.log(`Found User: ${user.company_name} (ID: ${user.id}, BN: ${user.business_number})`);

                // Hash '1234'
                const hashedPassword = await bcrypt.hash('1234', 10);

                await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hashedPassword, user.id]);
                console.log(`Password for ${user.company_name} reset to '1234'.`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

fixUsers();
