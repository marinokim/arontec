import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export const generateProposalExcel = async (proposalItems, user, setProposalItems, setShowProposalModal) => {
    if (proposalItems.length === 0) {
        alert('제안서 목록이 비어있습니다.')
        return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('제안서')

    // Define columns based on user requirement
    worksheet.columns = [
        { header: '순번', key: 'no', width: 5 },
        { header: '품절여부', key: 'status', width: 10 },
        { header: '고유번호', key: 'id', width: 10 },
        { header: '상품명', key: 'name', width: 40 },
        { header: '상품이미지', key: 'image', width: 20 },
        { header: '모델명', key: 'model', width: 15 },
        { header: '옵션', key: 'option', width: 10 },
        { header: '설명', key: 'desc', width: 40 },
        { header: '제조원', key: 'manufacturer', width: 15 },
        { header: '원산지', key: 'origin', width: 10 },
        { header: '카톤입수량', key: 'cartonQty', width: 10 },
        { header: '기본수량', key: 'defaultQty', width: 10 },
        { header: '소비자가', key: 'consumerPrice', width: 12 },
        { header: '공급가(부가세포함)', key: 'supplyPrice', width: 15 },
        { header: '개별배송비(부가세포함)', key: 'shipping', width: 15 },
        { header: '대표이미지', key: 'imageUrl', width: 30 },
        { header: '상세이미지', key: 'detailUrl', width: 30 },
        { header: '비고', key: 'remarks', width: 20 },
    ]

    // Insert Title/Warning Row at the top
    worksheet.insertRow(1, [])

    // Merge cells for Title, Warning, and File Info
    worksheet.mergeCells('A1:D1')
    worksheet.mergeCells('E1:L1')
    worksheet.mergeCells('M1:P1')

    // Set Title (ARONTEC Logo placeholder)
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'ARONTEC KOREA'
    titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: '003366' } } // Dark Blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

    // Set Warning Text
    const warningCell = worksheet.getCell('E1')
    warningCell.value = '■ 당사가 운영하는 모든 상품은 폐쇄몰을 제외한 온라인 판매를 금하며, 판매 시 상품 공급이 중단됩니다.'
    warningCell.font = { name: 'Malgun Gothic', size: 12, bold: true, color: { argb: 'FF0000' } } // Red
    warningCell.alignment = { vertical: 'middle', horizontal: 'left' }

    // Set File Info Text
    const now = new Date()
    const clientName = user?.companyName || 'Client'
    const dateStr = `${now.getFullYear()}년${now.getMonth() + 1}월${now.getDate()}일`
    const hours = now.getHours()
    const ampm = hours >= 12 ? '오후' : '오전'
    const timeStr = `${ampm}${hours % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`

    const fileInfoCell = worksheet.getCell('M1')
    fileInfoCell.value = `(${clientName})_제안_${dateStr}_${timeStr}`
    fileInfoCell.font = { name: 'Malgun Gothic', size: 10, bold: true }
    fileInfoCell.alignment = { vertical: 'middle', horizontal: 'right' }

    // Set Header Row Height
    worksheet.getRow(1).height = 30

    // Style Table Header Row (Now Row 2)
    const headerRow = worksheet.getRow(2)
    headerRow.font = { bold: true, color: { argb: '000000' } }
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'CCE5FF' } // Light blue background
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    // Add data rows
    for (let i = 0; i < proposalItems.length; i++) {
        const item = proposalItems[i]
        // Use getRow(i + 3) because Row 1 is Title, Row 2 is Header.
        // addRow() skips rows if addImage() instantiated the next row (due to 'br' coordinates).
        const row = worksheet.getRow(i + 3)
        row.values = {
            no: i + 1,
            status: item.is_available ? '' : '품절',
            id: item.id,
            name: item.brand ? `[${item.brand}] ${item.model_name}` : item.model_name,
            image: '', // Placeholder for image
            model: item.model_name,
            option: '',
            desc: item.description || '',
            manufacturer: item.manufacturer || '',
            origin: item.origin || '',
            cartonQty: item.quantity_per_carton || '',
            defaultQty: 1,
            consumerPrice: item.consumer_price ? parseInt(item.consumer_price) : '',
            supplyPrice: item.b2b_price ? parseInt(item.b2b_price) : '',
            shipping: item.shipping_fee ? parseInt(item.shipping_fee) : 0,
            imageUrl: item.image_url || '',
            detailUrl: item.detail_url || '',
            remarks: ''
        }

        // Set row height for image
        row.height = 100
        row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

        // Embed image if available
        if (item.image_url) {
            try {
                // Use backend proxy to avoid CORS and Mixed Content issues
                const proxyUrl = `${import.meta.env.VITE_API_URL}/api/products/proxy-image?url=${encodeURIComponent(item.image_url)}`

                // Fetch image as buffer via proxy
                const response = await fetch(proxyUrl)
                if (!response.ok) {
                    const errorText = await response.text()
                    console.error(`Proxy fetch failed for ${item.image_url}:`, response.status, response.statusText, errorText)
                    throw new Error(`Failed to fetch image: ${response.statusText}`)
                }

                const buffer = await response.arrayBuffer()

                // Determine extension from URL or Content-Type
                let extension = 'jpeg'
                const contentType = response.headers.get('content-type')
                if (contentType) {
                    if (contentType.includes('png')) extension = 'png'
                    else if (contentType.includes('gif')) extension = 'gif'
                } else {
                    const lowerUrl = item.image_url.toLowerCase()
                    if (lowerUrl.includes('.png')) extension = 'png'
                    else if (lowerUrl.includes('.gif')) extension = 'gif'
                }

                const imageId = workbook.addImage({
                    buffer: buffer,
                    extension: extension,
                })

                worksheet.addImage(imageId, {
                    tl: { col: 4, row: i + 2 }, // Column E (index 4)
                    br: { col: 5, row: i + 3 },
                    editAs: 'oneCell'
                })
            } catch (err) {
                console.error('Failed to embed image for', item.model_name, err)
                // Fallback: put text in the cell
                const cell = worksheet.getCell(i + 3, 5) // Row i+3, Col 5 (E)
                cell.value = '이미지 로드 실패'
            }
        }
    }

    // Generate filename: [ClientName]_제안_[YYYYMMDD]_[HHmm].xlsx
    const nowForFilename = new Date()
    const dateStrForFilename = nowForFilename.getFullYear() +
        String(nowForFilename.getMonth() + 1).padStart(2, '0') +
        String(nowForFilename.getDate()).padStart(2, '0')
    const timeStrForFilename = String(nowForFilename.getHours()).padStart(2, '0') +
        String(nowForFilename.getMinutes()).padStart(2, '0')

    const clientNameForFilename = user?.companyName || 'Client'
    const filename = `${clientNameForFilename}_제안_${dateStrForFilename}_${timeStrForFilename}.xlsx`

    // Generate and save file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)

    // Save history to backend
    try {
        const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/proposals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: filename.replace('.xlsx', ''),
                items: proposalItems
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Failed to save proposal history:', errorData)
            // Optional: Alert user if history saving fails, or just log it silently if it's not critical
            // alert('제안서 이력 저장에 실패했습니다: ' + (errorData.error || response.statusText))
        }
    } catch (error) {
        console.error('Failed to save proposal history:', error)
    }

    // Clear proposal list after download
    setProposalItems([])
    localStorage.removeItem('proposalItems')
    setShowProposalModal(false)
    alert('제안서가 다운로드되었습니다. 목록이 초기화됩니다.')
}

export const downloadProposalFromHistory = async (historyItem, user) => {
    const proposalItems = historyItem.items
    if (!proposalItems || proposalItems.length === 0) {
        alert('제안서 내용이 없습니다.')
        return
    }

    // Reuse the generation logic but skip saving history and clearing state
    // We need to refactor generateProposalExcel to separate generation from side effects
    // For now, let's just duplicate the generation part or make a shared internal function.
    // To avoid massive refactoring, I'll call a modified version or just copy the logic.
    // Actually, calling generateProposalExcel with dummy setters might work but it saves history again.
    // Let's extract the core logic.

    // ... Copying core logic for now to ensure stability ...
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('제안서')

    // Define columns based on user requirement
    worksheet.columns = [
        { header: '순번', key: 'no', width: 5 },
        { header: '품절여부', key: 'status', width: 10 },
        { header: '고유번호', key: 'id', width: 10 },
        { header: '상품명', key: 'name', width: 40 },
        { header: '상품이미지', key: 'image', width: 20 },
        { header: '모델명', key: 'model', width: 15 },
        { header: '옵션', key: 'option', width: 10 },
        { header: '설명', key: 'desc', width: 40 },
        { header: '제조원', key: 'manufacturer', width: 15 },
        { header: '원산지', key: 'origin', width: 10 },
        { header: '카톤입수량', key: 'cartonQty', width: 10 },
        { header: '기본수량', key: 'defaultQty', width: 10 },
        { header: '소비자가', key: 'consumerPrice', width: 12 },
        { header: '공급가(부가세포함)', key: 'supplyPrice', width: 15 },
        { header: '개별배송비(부가세포함)', key: 'shipping', width: 15 },
        { header: '대표이미지', key: 'imageUrl', width: 30 },
        { header: '상세이미지', key: 'detailUrl', width: 30 },
        { header: '비고', key: 'remarks', width: 20 },
    ]

    // Insert Title/Warning Row at the top
    worksheet.insertRow(1, [])
    worksheet.mergeCells('A1:D1')
    worksheet.mergeCells('E1:L1')
    worksheet.mergeCells('M1:P1')

    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'ARONTEC KOREA'
    titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: '003366' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

    const warningCell = worksheet.getCell('E1')
    warningCell.value = '■ 당사가 운영하는 모든 상품은 폐쇄몰을 제외한 온라인 판매를 금하며, 판매 시 상품 공급이 중단됩니다.'
    warningCell.font = { name: 'Malgun Gothic', size: 12, bold: true, color: { argb: 'FF0000' } }
    warningCell.alignment = { vertical: 'middle', horizontal: 'left' }

    const fileInfoCell = worksheet.getCell('M1')
    fileInfoCell.value = historyItem.title // Use stored title
    fileInfoCell.font = { name: 'Malgun Gothic', size: 10, bold: true }
    fileInfoCell.alignment = { vertical: 'middle', horizontal: 'right' }

    worksheet.getRow(1).height = 30

    const headerRow = worksheet.getRow(2)
    headerRow.font = { bold: true, color: { argb: '000000' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCE5FF' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    for (let i = 0; i < proposalItems.length; i++) {
        const item = proposalItems[i]
        const row = worksheet.getRow(i + 3)
        row.values = {
            no: i + 1,
            status: item.is_available ? '' : '품절',
            id: item.id,
            name: item.brand ? `[${item.brand}] ${item.model_name}` : item.model_name,
            image: '',
            model: item.model_name,
            option: '',
            desc: item.description || '',
            manufacturer: item.manufacturer || '',
            origin: item.origin || '',
            cartonQty: item.quantity_per_carton || '',
            defaultQty: 1,
            consumerPrice: item.consumer_price ? parseInt(item.consumer_price) : '',
            supplyPrice: item.b2b_price ? parseInt(item.b2b_price) : '',
            shipping: item.shipping_fee ? parseInt(item.shipping_fee) : 0,
            imageUrl: item.image_url || '',
            detailUrl: item.detail_url || '',
            remarks: ''
        }
        row.height = 100
        row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

        if (item.image_url) {
            try {
                const proxyUrl = `${import.meta.env.VITE_API_URL}/api/products/proxy-image?url=${encodeURIComponent(item.image_url)}`
                const response = await fetch(proxyUrl)
                if (response.ok) {
                    const buffer = await response.arrayBuffer()
                    let extension = 'jpeg'
                    if (item.image_url.toLowerCase().includes('.png')) extension = 'png'

                    const imageId = workbook.addImage({ buffer: buffer, extension: extension })
                    worksheet.addImage(imageId, {
                        tl: { col: 4, row: i + 2 },
                        br: { col: 5, row: i + 3 },
                        editAs: 'oneCell'
                    })
                }
            } catch (err) {
                console.error('Failed to embed image', err)
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${historyItem.title}.xlsx`)
}
