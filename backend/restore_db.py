import sys
import os
import json
import ssl
import glob
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def get_latest_backup_file(backup_dir, table_name):
    # Find files matching {table_name}_backup_*.json
    pattern = os.path.join(backup_dir, f"{table_name}_backup_*.json")
    files = glob.glob(pattern)
    if not files:
        return None
    # Sort by name (timestamp is in name)
    files.sort(reverse=True)
    return files[0]

def restore_db():
    backup_dir = './db_backup'
    # Order matters for foreign keys!
    # 1. Parents: categories, users
    # 2. Children: products, carts, notifications, quotes
    # 3. Grandchildren: quote_items, proposal_history
    tables_order = [
         'categories', 
         'users', 
         'products', 
         'carts', 
         'notifications', 
         'quotes', 
         'proposal_history',
         'quote_items' # quote_items likely references quotes and products
    ]

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("Connecting to DB...")
    con = pg8000.native.Connection(
        user="postgres.zgqnhbaztgpekerhxwbc",
        password="gmlrhks0528&*",
        host="aws-1-ap-northeast-2.pooler.supabase.com",
        port=5432,
        database="postgres",
        ssl_context=ssl_context
    )

    print("WARNING: This will TRUNCATE (delete all data from) the tables before restoring.")
    print("Starting restore process...")

    # We might need to disable triggers constraints? 
    # Or just delete in reverse order and insert in correct order.
    # To be safe, let's delete in reverse order.
    
    print("Clearing existing data (Reverse Order)...")
    for table in reversed(tables_order):
        try:
            print(f"Truncating {table}...")
            # CASCADE required if FKs exist
            con.run(f"TRUNCATE TABLE {table} CASCADE")
        except Exception as e:
            print(f"Error truncating {table}: {e}")

    print("Restoring data (Forward Order)...")
    for table in tables_order:
        backup_file = get_latest_backup_file(backup_dir, table)
        if not backup_file:
            print(f"No backup file found for {table}. Skipping import.")
            continue
            
        print(f"Loading {table} from {backup_file}...")
        try:
            with open(backup_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not data:
                print(f"Backup file for {table} is empty.")
                continue

            columns = list(data[0].keys())
            cols_str = ", ".join(columns)
            vals_str = ", ".join([f":{c}" for c in columns])
            
            stmt = f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str})"
            
            # Batch insert ideally, but simple loop for now provided data isn't massive (1000 rows is fine)
            count = 0
            for row in data:
                # Handle types if necessary? pg8000 usually handles basic types.
                # Timestamps might be strings in JSON -> pg8000 accepts ISO strings for timestamp columns
                # Decimals might be floats/strings -> PG handles numbers.
                con.run(stmt, **row)
                count += 1
            
            print(f"Restored {count} rows to {table}.")
            
        except Exception as e:
             print(f"Error restoring {table}: {e}")

    con.close()
    print("Restore process completed.")

if __name__ == "__main__":
    restore_db()
