import pandas as pd
import os

file_path = './excel/aron_product_upload_consolidated.xlsx'

try:
    df = pd.read_excel(file_path)
    # create a column with index to track original rows, assuming 0-based index matches excel row-2 (header is row 1)
    # Actually, let's just print the index and the row content
    
    # Filter for '고가연' or '플비락' in any string column or specifically 'model_name' or similar
    # Adjust column names as needed based on file inspection, but for now just search all
    
    print("Columns:", df.columns.tolist())
    
    for term in ['고가연', '플비락']:
        print(f"Searching for {term}...")
        # Search in Likely columns: '상품명', '모델명' etc.
        # Let's simple search row by row for safety or use apply
        mask = df.apply(lambda x: x.astype(str).str.contains(term, case=False).any(), axis=1)
        matches = df[mask]
        
        if not matches.empty:
            print(f"Found {len(matches)} matches for {term}:")
            for idx, row in matches.iterrows():
                # Excel row is idx + 2 (header is 1, 0-based index)
                print(f"Excel Row: {idx + 2}")
                print(row.to_dict())
                print("-" * 20)
        else:
            print(f"No matches for {term}")

except Exception as e:
    print(f"Error: {e}")
