
import os
import sys
import ssl
import pg8000.native

# Helper to connect
def get_con():
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return pg8000.native.Connection(
        user="postgres.zgqnhbaztgpekerhxwbc",
        password="gmlrhks0528&*",
        host="aws-1-ap-northeast-2.pooler.supabase.com",
        port=5432,
        database="postgres",
        ssl_context=ssl_context
    )

def find_user(query_str):
    con = get_con()
    print(f"Searching for: {query_str}")
    
    # Check by Business Number (exact, or stripped)
    # Check by Email
    # Check by Company Name
    
    sql = """
        SELECT id, email, company_name, business_number, is_approved, created_at 
        FROM users 
        WHERE 
            business_number LIKE :q OR 
            business_number LIKE :q_stripped OR
            email ILIKE :q_like OR 
            company_name ILIKE :q_like
    """
    
    q_stripped = query_str.replace('-', '')
    
    try:
        rows = con.run(sql, q=query_str, q_stripped=q_stripped, q_like=f'%{query_str}%')
        if not rows:
            print("No users found.")
        else:
            print(f"Found {len(rows)} users:")
            for r in rows:
                print(f"ID: {r[0]}, Email: {r[1]}, Company: {r[2]}, BN: {r[3]}, Approved: {r[4]}, Created: {r[5]}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        con.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/find_user.py <search_term>")
        sys.exit(1)
    
    find_user(sys.argv[1])
