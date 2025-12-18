import sys
import os
import json
import datetime
import ssl
import decimal
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

# Helper for JSON serialization of special types
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)

def backup_db():
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = './db_backup'
    
    # DB Connection
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

    tables = ['categories', 'products', 'users', 'carts', 'notifications', 'quotes', 'quote_items', 'proposal_history']
    
    for table in tables:
        print(f"Backing up table: {table}...")
        # Get column names
        # In native, querying returns list of lists, but doesn't give dicts automatically unless we parse description
        # We can use a query that returns json directly from postgres, or just fetch and zip with columns
        
        # Simple fetch
        try:
            # Get columns
            # This 'SELECT *' is fine for backup
            # We need to know column names to make useful JSON
            # pg8000.native run() returns a list of rows. 
            # We can query information_schema or just LIMIT 0 to get description?
            # Creating a cursor-like behavior manually or using `columns` property if available?
            # pg8000.native Connection.columns is available after a query
            
            res = con.run(f"SELECT * FROM {table}")
            columns = [c['name'] for c in con.columns]
            
            data = []
            for row in res:
                item = dict(zip(columns, row))
                data.append(item)
            
            filename = f"{backup_dir}/{table}_backup_{timestamp}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, cls=DateEncoder, ensure_ascii=False, indent=2)
            
            print(f"Saved {len(data)} rows to {filename}")
            
        except Exception as e:
            print(f"Error backing up {table}: {e}")

    con.close()
    print("Backup process completed.")

if __name__ == "__main__":
    backup_db()
