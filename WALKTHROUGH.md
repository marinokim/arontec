# Walkthrough - Excel Range Import Feature

- **Modified `backend/routes/excel.js`**:
    - Added `POST /api/excel/register-range` endpoint.
    - This endpoint executes the Python script and streams the output back to the client.

## Verification Results

### Automatic Verification
- **Test**: Registered range (e.g., 2552-2552).
- **Result**: Success message received. Product updated/inserted correctly.

## Server Excel Update Feature (Newly Added)
Added a feature to update the source Excel file directly from the Admin UI, bypassing the need for git commits for data updates.

### Updates (Fixes)
- **Manufacturer Import Fix**: Corrected script to query and update `manufacturer`, `origin`, etc. (Previously missing).
- **Image URL Extraction**: Added logic to extract URL from `<img src=...>` tags in the Excel file automatically.
- **Admin UI Layout Fix**: Improved the Products page toolbar preventing overlapping.
- **Daily Local DB Backup**: Implemented automatic backup to `backend/google_drive_backup` at 13:00 daily.

### Daily Backup Setup
1.  **Install Dependency**: Run `npm install` in `backend` directory to install `node-cron`.
2.  **Restart Server**: The backup scheduler runs when the server starts.
3.  **Google Drive Sync**: Install "Google Drive for Desktop" and sync the `backend/google_drive_backup` folder.

### 4. Product Catalog Updates
- Added **Sort by Price** functionality.
- Buttons "최신순" (Newest), "낮은가격순" (Low Price), "높은가격순" (High Price) added to the catalog header.
- Sorting works in combination with search and category filters.

### 5. Category Management (Admin)
- Admin Product Page: "Category Manage" (카테고리 관리) button replaced "Add Category".
- **Features**:
    - **List**: View all categories and product counts.
    - **Edit**: Rename categories (updates all related products automatically).
    - **Delete**: Deletes empty categories. (Safe Delete: Blocked if products exist in the category).
    - **Add**: Create new categories.

### How to use
1. Go to Admin > Products page.
2. Locate the "서버 원본 교체" (Update Master File) section.
3. Select your modified `.xlsx` file.
4. Click "파일 교체" (Replace File).
5. The server's `aron_product_upload_consolidated.xlsx` will be overwritten with your uploaded file.
6. You can then immediately use "범위 등록" (Range Register) with the new data.

### Verification
- **Test**: Registered range (e.g., 2553-2594).
- **Result**: Success message received. Product updated/inserted correctly. `Manufacturer` and `ImageURL` fields processed correctly.

## Screenshots
![Range Import UI](/Users/lab/.gemini/antigravity/brain/40b2bf77-b861-4332-ba79-031643c1c89d/uploaded_image_1765870699952.png)
*(Screenshot showing successful debug output)**
```
Starting registration for range 2552-2552
Connecting to DB...
Pre-fetching existing products...
Loading Excel: ./excel/aron_product_upload_consolidated.xlsx
Processing rows 2552 to 2552...
Updated Product 1173 (디어쿠스틱  올인원 블루투스 오디오 DIO)
Range Processing Complete. Inserted: 0, Updated: 1, Errors: 0
```

## How to Use
1.  Navigate to the **Product Management** page (Admin).
2.  Locate the **"서버 엑셀 등록"** section (gray box).
3.  Enter the **Start Row** and **End Row** numbers (e.g., 2000 ~ 2010).
4.  Click **"범위 등록"**.
5.  Wait for the alert confirming completion and showing the result count.
