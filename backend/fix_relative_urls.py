import sys
import os
import ssl
sys.path.append(os.path.join(os.getcwd(), 'pylib'))

import pg8000.native

def fix_relative_urls():
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

    # Fix ImageURLs
    print("Fixing ImageURLs starting with //...")
    # Using SQL's string concatenation: 'https:' || image_url
    # Note: supabase/postgres string concat is ||
    count_img = con.run("UPDATE products SET image_url = 'https:' || image_url WHERE image_url LIKE '//%'")
    # pg8000 run returns None for update usually, or rowcount if configured? 
    # Actually pg8000.native returns None. Only run with no fetch returns None.
    # We can't easily get row count without returning something or checking before/after.
    # We'll just assume it runs.
    
    # Let's check how many to provide feedback (optional, but good for logs)
    # Actually, let's just run the update.
    
    # Fix DetailURLs
    print("Fixing DetailURLs starting with //...")
    con.run("UPDATE products SET detail_url = 'https:' || detail_url WHERE detail_url LIKE '//%'")
    
    # Also fix where <img> tags might have src="//..."
    # This is trickier with simple SQL replace.
    # string replace: REPLACE(detail_url, 'src="//', 'src="https://')
    # Use with caution to avoid double https if logic is weird, but 'src="//' is specific enough.
    print("Fixing <img> src attributes starting with // in DetailURL...")
    con.run("UPDATE products SET detail_url = REPLACE(detail_url, 'src=\"//', 'src=\"https://') WHERE detail_url LIKE '%src=\"//%'")
    con.run("UPDATE products SET detail_url = REPLACE(detail_url, 'src=''//', 'src=''https://') WHERE detail_url LIKE '%src=''//%'")

    print("Checking results...")
    res = con.run("SELECT id, model_name, image_url, detail_url FROM products WHERE image_url LIKE '//%' OR detail_url LIKE '//%' LIMIT 5")
    if not res:
        print("No more relative URLs found starting with //.")
    else:
        print("Warning: Some relative URLs still exist:")
        for r in res:
            print(r)

    con.close()
    print("Fix complete.")

if __name__ == "__main__":
    fix_relative_urls()
