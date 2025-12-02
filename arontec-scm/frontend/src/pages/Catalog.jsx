import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import './Catalog.css'

function Catalog({ user }) {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [search, setSearch] = useState('')
    const [proposalItems, setProposalItems] = useState([])
    const [showProposalModal, setShowProposalModal] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchCategories()
        fetchProducts()
        const savedProposal = localStorage.getItem('proposalItems')
        if (savedProposal) {
            setProposalItems(JSON.parse(savedProposal))
        }
    }, [selectedCategory, search])

    const fetchCategories = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories', { credentials: 'include' })
        const data = await res.json()
        setCategories(data.categories)
    }

    const fetchProducts = async () => {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)
        if (search) params.append('search', search)

        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products?${params}`, { credentials: 'include' })
        const data = await res.json()
        setProducts(data.products)
    }

    const addToCart = async (productId, items) => {
        // items can be a single object { quantity, option } or an array of objects
        const itemsToAdd = Array.isArray(items) ? items : [items]

        if (itemsToAdd.length === 0) return

        let successCount = 0

        for (const item of itemsToAdd) {
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        productId,
                        quantity: item.quantity,
                        option: item.option
                    })
                })

                if (res.ok) {
                    successCount++
                } else {
                    if (res.status === 401) {
                        alert('로그인이 필요합니다')
                        return
                    }
                    const data = await res.json()
                    console.error('Add to cart failed:', data.error)
                }
            } catch (error) {
                console.error('Add to cart error:', error)
            }
        }

        if (successCount > 0) {
            alert(`${successCount}개 항목이 장바구니에 추가되었습니다`)
        } else {
            alert('장바구니 추가에 실패했습니다')
        }
    }

    const addToProposal = (product) => {
        if (proposalItems.find(item => item.id === product.id)) {
            alert('이미 제안서 목록에 있는 상품입니다.')
            return
        }
        const newItems = [...proposalItems, product]
        setProposalItems(newItems)
        localStorage.setItem('proposalItems', JSON.stringify(newItems))
    }

    const removeFromProposal = (productId) => {
        const newItems = proposalItems.filter(item => item.id !== productId)
        setProposalItems(newItems)
        localStorage.setItem('proposalItems', JSON.stringify(newItems))
    }

    const generateProposalExcel = async () => {
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

        // Merge cells for Title and Warning
        worksheet.mergeCells('A1:C1')
        worksheet.mergeCells('D1:R1')

        // Set Title (ARONTEC Logo placeholder)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'ARONTEC KOREA'
        titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: '003366' } } // Dark Blue
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

        // Set Warning Text
        const warningCell = worksheet.getCell('D1')
        warningCell.value = '■ 당사가 운영하는 모든 상품은 폐쇄몰을 제외한 온라인 판매를 금하며, 판매 시 상품 공급이 중단됩니다.'
        warningCell.font = { name: 'Malgun Gothic', size: 12, bold: true, color: { argb: 'FF0000' } } // Red
        warningCell.alignment = { vertical: 'middle', horizontal: 'left' }

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

        // Generate and save file
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, `제안서_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    return (
        <div className="catalog-page">
            <div className="catalog-header">
                <h1>상품 카탈로그</h1>
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← 대시보드</button>
            </div>

            <div className="catalog-filters">
                <div className="filter-group">
                    <label>카테고리</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">전체</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>검색</label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="브랜드 또는 모델명 검색"
                    />
                </div>
            </div>

            <div className="products-grid">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onAddToProposal={addToProposal}
                        navigate={navigate}
                        user={user}
                        proposalItems={proposalItems}
                    />
                ))}
            </div>

            {products.length === 0 && (
                <div className="no-products">조회된 상품이 없습니다</div>
            )}

            {/* Proposal Floating Button */}
            <div
                className="proposal-fab"
                onClick={() => setShowProposalModal(true)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: '#28a745',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '50px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 100
                }}
            >
                <span>📋 제안서 관리</span>
                <span style={{ background: 'white', color: '#28a745', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {proposalItems.length}
                </span>
            </div>

            {/* Proposal Modal */}
            {showProposalModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '800px',
                        maxHeight: '80vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>제안서 목록 ({proposalItems.length})</h2>
                            <button onClick={() => setShowProposalModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {proposalItems.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>제안서 목록에 담긴 상품이 없습니다.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {proposalItems.map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: '1rem', border: '1px solid #eee', padding: '1rem', borderRadius: '8px', alignItems: 'center' }}>
                                        <img src={item.image_url} alt={item.model_name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', color: '#666' }}>{item.brand}</div>
                                            <div style={{ fontWeight: 'bold' }}>{item.model_name}</div>
                                            <div style={{ color: '#007bff' }}>{parseInt(item.b2b_price).toLocaleString()}원</div>
                                        </div>
                                        <button
                                            onClick={() => removeFromProposal(item.id)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setProposalItems([]) || localStorage.removeItem('proposalItems')}
                                className="btn btn-secondary"
                                style={{ background: '#dc3545' }}
                            >
                                전체 삭제
                            </button>
                            <button
                                onClick={generateProposalExcel}
                                className="btn btn-primary"
                                style={{ background: '#28a745' }}
                            >
                                엑셀 다운로드 (.xlsx)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ProductCard({ product, onAddToCart, onAddToProposal, navigate, user, proposalItems }) {
    const [isHovered, setIsHovered] = useState(false)
    const [quantities, setQuantities] = useState({})
    const [defaultQuantity, setDefaultQuantity] = useState(1)

    const isInProposal = proposalItems && proposalItems.find(item => item.id === product.id)

    // Parse options: support comma, newline, slash
    const rawOptions = product.product_options

    const options = rawOptions
        ? rawOptions.split(/[,/\n]+/).map(opt => opt.trim()).filter(opt => opt)
        : []

    // Initialize quantities for options
    useEffect(() => {
        if (options.length > 0) {
            const initialQuantities = {}
            options.forEach(opt => {
                initialQuantities[opt] = 0
            })
            setQuantities(initialQuantities)
        }
    }, [product.product_options])

    const handleQuantityChange = (option, delta) => {
        setQuantities(prev => ({
            ...prev,
            [option]: Math.max(0, (prev[option] || 0) + delta)
        }))
    }

    const handleAddToCart = (e) => {
        e.stopPropagation()

        if (options.length > 0) {
            const itemsToAdd = Object.entries(quantities)
                .filter(([_, qty]) => qty > 0)
                .map(([opt, qty]) => ({
                    quantity: qty,
                    option: opt
                }))

            if (itemsToAdd.length === 0) {
                alert('최소 1개 이상의 옵션을 선택해주세요')
                return
            }

            onAddToCart(product.id, itemsToAdd)

            // Reset quantities after add
            const resetQuantities = {}
            options.forEach(opt => {
                resetQuantities[opt] = 0
            })
            setQuantities(resetQuantities)
        } else {
            onAddToCart(product.id, { quantity: defaultQuantity, option: '' })
        }
    }

    const handleAddToProposal = (e) => {
        e.stopPropagation()
        onAddToProposal(product)
    }

    return (
        <div
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="product-image-container">
                <div className={`product-image ${isHovered ? 'hovered' : ''}`}>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.model_name} />
                    ) : (
                        <div className="no-image">No Image</div>
                    )}
                    {isHovered && (
                        <div className="image-overlay">
                            <h3>{product.brand}</h3>
                            <p className="model">{product.model_name}</p>
                            <div className="prices">
                                <span className="consumer-price">{parseInt(product.consumer_price).toLocaleString()}</span>
                                <span className="b2b-price">{parseInt(product.b2b_price).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {!isHovered ? (
                <div className="product-info-default">
                    <h3>{product.brand}</h3>
                    <p className="model">{product.model_name}</p>
                    <div className="prices">
                        <span className="consumer-price">{parseInt(product.consumer_price).toLocaleString()}</span>
                        <span className="b2b-price">{parseInt(product.b2b_price).toLocaleString()}</span>
                    </div>
                    {product.remarks && (
                        <p className="remarks">{product.remarks}</p>
                    )}
                    <div className="action-buttons-default">
                        <button
                            className="btn-add-cart-default"
                            onMouseEnter={() => setIsHovered(true)}
                            onClick={(e) => { e.stopPropagation(); setIsHovered(true); }}
                        >
                            바로담기
                        </button>
                        <button
                            className={`btn-heart ${isInProposal ? 'active' : ''}`}
                            onClick={handleAddToProposal}
                        >
                            ♥
                        </button>
                    </div>
                </div>
            ) : (
                <div className="product-actions-hover" onClick={e => e.stopPropagation()}>
                    <div className="option-selector-container" style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        marginBottom: '10px',
                        width: '100%'
                    }}>
                        {options.length > 0 ? (
                            <div className="option-list" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {options.map((opt, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#333' }}>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '5px' }}>{opt}</span>
                                        <div className="quantity-control" style={{ background: '#f1f3f5', borderRadius: '4px', padding: '2px' }}>
                                            <button onClick={() => handleQuantityChange(opt, -1)} style={{ color: '#333', border: 'none', background: 'transparent' }}>-</button>
                                            <span style={{ minWidth: '20px', textAlign: 'center', display: 'inline-block', fontWeight: 'bold' }}>{quantities[opt] || 0}</span>
                                            <button onClick={() => handleQuantityChange(opt, 1)} style={{ color: '#333', border: 'none', background: 'transparent' }}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' }}>
                                <span>기본 옵션</span>
                                <div className="quantity-control" style={{ background: '#f1f3f5', borderRadius: '4px', padding: '2px' }}>
                                    <button onClick={() => setDefaultQuantity(Math.max(1, defaultQuantity - 1))} style={{ color: '#333', border: 'none', background: 'transparent' }}>-</button>
                                    <span style={{ minWidth: '20px', textAlign: 'center', display: 'inline-block', fontWeight: 'bold' }}>{defaultQuantity}</span>
                                    <button onClick={() => setDefaultQuantity(defaultQuantity + 1)} style={{ color: '#333', border: 'none', background: 'transparent' }}>+</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn-add-cart-hover"
                        onClick={handleAddToCart}
                        style={{ width: '100%', marginTop: '5px' }}
                    >
                        바로담기
                    </button>
                </div>
            )}
        </div>
    )
}

export default Catalog
