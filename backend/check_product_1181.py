import sys
import os
import ssl

# Fix path to pylib
current_dir = os.path.dirname(os.path.abspath(__file__))
pylib_path = os.path.join(current_dir, '..', 'pylib')
sys.path.append(pylib_path)

import pg8000.native

# DB Connection
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

try:
    con = pg8000.native.Connection(
        user="postgres.zgqnhbaztgpekerhxwbc",
        password="gmlrhks0528&*",
        host="aws-1-ap-northeast-2.pooler.supabase.com",
        port=5432,
        database="postgres",
        ssl_context=ssl_context
    )

    rows = con.run("SELECT id, model_name, manufacturer, origin FROM products WHERE id = 1181")
    for r in rows:
        print(f"Product 1181: {r}")
        
    con.close()

except Exception as e:
    print(f"Error: {e}")
