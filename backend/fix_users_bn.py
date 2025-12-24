
import ssl
import pg8000.native
import bcrypt

def fix_users():
    # Setup connection
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

    try:
        # 1. Normalize Business Numbers (Remove hyphens)
        print("Normalizing business numbers...")
        con.run("UPDATE users SET business_number = REPLACE(business_number, '-', '') WHERE business_number LIKE '%-%'")
        
        # 2. Find MindK and Reset Password
        print("Finding 'MindK'...")
        rows = con.run("SELECT id, email, company_name, business_number FROM users WHERE company_name LIKE '%마인드케이%' OR company_name LIKE '%MindK%'")
        
        if not rows:
            print("MindK user not found.")
        else:
            for r in rows:
                uid, email, name, bn = r
                print(f"Found User: {name} (ID: {uid}, BN: {bn})")
                
                # Reset Password to '1234'
                # Hash for '1234'
                # using bcrypt (synchronously for script simplicity, or just use a known hash)
                # '1234' hash: $2b$10$Xw... (let's generate one or use python bcrypt)
                hashed = bcrypt.hashpw('1234'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                con.run("UPDATE users SET password_hash = :h, updated_at = NOW() WHERE id = :id", h=hashed, id=uid)
                print(f"Password for {name} reset to '1234'.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        con.close()

if __name__ == "__main__":
    fix_users()
