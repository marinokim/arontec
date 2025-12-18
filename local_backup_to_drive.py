import os
import psycopg2
import csv
import datetime
import zipfile
import shutil

# Configuration
BACKUP_DIR = os.path.expanduser("~/Desktop/GoogleDrive_Backup") 
DB_HOST = "aws-1-ap-northeast-2.pooler.supabase.com"
DB_PORT = "5432"
DB_USER = "postgres.zgqnhbaztgpekerhxwbc"
DB_NAME = "postgres"
DB_PASS = "gmlrhks0528&*"

def perform_backup():
    # Ensure backup directory exists
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    temp_dir = os.path.join(BACKUP_DIR, f"temp_{timestamp}")
    os.makedirs(temp_dir, exist_ok=True)
    
    zip_filename = f"db_backup_{timestamp}.zip"
    zip_filepath = os.path.join(BACKUP_DIR, zip_filename)

    print(f"Starting backup of {DB_HOST}...")
    
    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            dbname=DB_NAME,
            password=DB_PASS
        )
        cur = conn.cursor()

        # Get list of tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"Found {len(tables)} tables to backup.")

        for table in tables:
            print(f"Backing up table: {table}")
            file_path = os.path.join(temp_dir, f"{table}.csv")
            
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                # Use COPY command for fast export
                # COPY (SELECT * FROM table) TO STDOUT WITH CSV HEADER
                sql = f"COPY (SELECT * FROM public.\"{table}\") TO STDOUT WITH CSV HEADER"
                cur.copy_expert(sql, f)
        
        # Create ZIP file
        print("Compressing files...")
        with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    zipf.write(os.path.join(root, file), file)
        
        print(f"✅ Backup successful! Created: {zip_filepath}")
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
    finally:
        if conn:
            conn.close()
        # Clean up temp files
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

if __name__ == "__main__":
    perform_backup()
