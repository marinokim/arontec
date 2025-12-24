import cloudinary
import cloudinary.api
import os

# Manual .env parsing
env_vars = {}
try:
    with open('./backend/.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()
except Exception as e:
    print(f"Error reading .env: {e}")

cloudinary.config(
    cloud_name=env_vars.get('CLOUDINARY_CLOUD_NAME'),
    api_key=env_vars.get('CLOUDINARY_API_KEY'),
    api_secret=env_vars.get('CLOUDINARY_API_SECRET'),
    secure=True
)

def list_and_restore():
    print("Fetching images from Cloudinary...")
    # Search for images in the folder
    # We can use the Admin API
    try:
        # Get resources
        resp = cloudinary.api.resources(
            type="upload",
            prefix="arontec-products", # folder prefix
            max_results=100,
            direction="desc" # Newest first
        )
        
        print(f"Found {len(resp.get('resources', []))} images.")
        for res in resp.get('resources', []):
            print(f"ID: {res['public_id']} | URL: {res['secure_url']} | Created: {res['created_at']}")
            
    except Exception as e:
        print(f"Cloudinary Error: {e}")

if __name__ == "__main__":
    list_and_restore()
