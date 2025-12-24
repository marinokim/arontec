import pandas as pd

file_path = './excel/aron_product_upload_consolidated.xlsx'

try:
    # Read the excel file
    df = pd.read_excel(file_path)
    
    # Adjust for 0-based index. Excel row 138 is index 136 (if header is row 1)
    # Let's inspect a range around 138-151 to be sure.
    # User said 138-151. 
    start_idx = 138 - 2 # 136
    end_idx = 151 - 2 # 149
    
    print(f"Inspecting rows corresponding to Excel 138-151 (Indices {start_idx} to {end_idx})")
    
    # Check if indices exist
    if start_idx < len(df):
        subset = df.iloc[start_idx:end_idx+1]
        print(subset[['상품명', '모델명', '이미지', '상세이미지']].to_string())
    else:
        print("Rows do not exist yet.")
        
except Exception as e:
    print(f"Error: {e}")
