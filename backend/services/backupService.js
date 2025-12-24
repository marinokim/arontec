import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupDir = path.join(__dirname, '..', 'google_drive_backup');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

export const performBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Database connection string from environment or hardcoded configuration
    // Assuming configured in .env or config/database.js. 
    // For pg_dump, we need to pass the connection string.
    // Constructing it from known credentials:
    const dbConfig = {
        user: 'postgres.zgqnhbaztgpekerhxwbc',
        host: 'aws-1-ap-northeast-2.pooler.supabase.com',
        database: 'postgres',
        password: 'gmlrhks0528&*',
        port: 5432
    };

    // PGPASSWORD environment variable is used to avoid password prompt
    const env = { ...process.env, PGPASSWORD: dbConfig.password };
    const dumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filepath}"`;

    console.log(`Starting backup to ${filepath}...`);

    exec(dumpCommand, { env }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`Backup stderr: ${stderr}`);
        }
        console.log(`Backup successfully created: ${filename}`);

        // Optional: Clean up old backups (keep last 30 days)
        cleanOldBackups();
    });
};

const cleanOldBackups = () => {
    fs.readdir(backupDir, (err, files) => {
        if (err) return console.error('Unable to verify old backups:', err);

        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

        files.forEach(file => {
            if (!file.startsWith('backup_') || !file.endsWith('.sql')) return;

            const filePath = path.join(backupDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;

                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlink(filePath, err => {
                        if (err) console.error(`Error deleting old backup ${file}:`, err);
                        else console.log(`Deleted old backup: ${file}`);
                    });
                }
            });
        });
    });
};
