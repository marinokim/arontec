import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import './Catalog.css'
import { sortCategories, getCategoryColor } from '../constants/categories'

import Navbar from '../components/Navbar'

function Catalog({ user }) {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [totalCount, setTotalCount] = useState(0)

    // Initialize state from sessionStorage if available
    const [selectedCategory, setSelectedCategory] = useState(() => {
        return sessionStorage.getItem('catalog_category') || ''
    })
    const [showNewOnly, setShowNewOnly] = useState(() => {
        return sessionStorage.getItem('catalog_showNew') === 'true'
    })
    const [search, setSearch] = useState(() => {
        return sessionStorage.getItem('catalog_search') || ''
    })

    const [proposalItems, setProposalItems] = useState([])
    const [showProposalModal, setShowProposalModal] = useState(false)
    const navigate = useNavigate()

    // Save state to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('catalog_category', selectedCategory)
        sessionStorage.setItem('catalog_showNew', showNewOnly)
        sessionStorage.setItem('catalog_search', search)
    }, [selectedCategory, showNewOnly, search])

    // Restore scroll position
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('catalog_scroll')
        if (savedScroll && products.length > 0) {
            // Small timeout to ensure rendering is done
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll))
                // Optional: Clear scroll after restoring? 
                // No, keep it in case user navigates away and back again without unmounting/remounting issues, 
                // though usually we want to clear it if they navigate to a different page from catalog that isn't product detail.
                // But detecting "where they are going" is hard here.
                // Let's just keep it. If they manually scroll, it updates.
            }, 100)
        }
    }, [products])

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('catalog_scroll', window.scrollY)
        }

        // Debounce scroll handler
        let timeoutId
        const debouncedScroll = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleScroll, 100)
        }

        window.addEventListener('scroll', debouncedScroll)
        return () => {
            window.removeEventListener('scroll', debouncedScroll)
            clearTimeout(timeoutId)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
        fetchProducts()
        const savedProposal = localStorage.getItem('proposalItems')
        if (savedProposal) {
            setProposalItems(JSON.parse(savedProposal))
        }
    }, [selectedCategory, search, showNewOnly])

    const fetchCategories = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories?sort=display_order', { credentials: 'include' })
        const data = await res.json()
        setCategories(data.categories)
        setTotalCount(data.totalCount || 0)
    }

    const fetchProducts = async () => {
        const params = new URLSearchParams()
        if (selectedCategory) params.append('category', selectedCategory)
        if (search) params.append('search', search)
        if (showNewOnly) params.append('isNew', 'true')
        params.append('sort', 'display_order')

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

        // Clear proposal list after download
        setProposalItems([])
        localStorage.removeItem('proposalItems')
        setShowProposalModal(false)
        alert('제안서가 다운로드되었습니다. 목록이 초기화됩니다.')
    }

    return (
        <div className="catalog-page">
            <Navbar user={user} />
            <div className="catalog-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <h1>상품 카탈로그</h1>
                    <label style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: showNewOnly ? '#ff4444' : '#fff',
                        padding: '8px 16px',
                        borderRadius: '25px',
                        border: '2px solid #ff4444',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                        <input
                            type="checkbox"
                            checked={showNewOnly}
                            onChange={(e) => setShowNewOnly(e.target.checked)}
                            style={{ display: 'none' }}
                        />
                        <span style={{
                            fontWeight: 'bold',
                            color: showNewOnly ? '#fff' : '#ff4444',
                            fontSize: '1rem'
                        }}>
                            {showNewOnly ? '✓ NEW 신상품 모아보기' : 'NEW 신상품만 보기'}
                        </span>
                    </label>
                </div>
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← 대시보드</button>
            </div>

            {/* Proposal Guide */}
            {(() => {
                const [showGuide, setShowGuide] = useState(() => localStorage.getItem('catalog_showGuide') !== 'false')

                if (!showGuide) return null

                return (
                    <div style={{
                        background: '#e3f2fd',
                        border: '1px solid #90caf9',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <button
                            onClick={() => {
                                setShowGuide(false)
                                localStorage.setItem('catalog_showGuide', 'false')
                            }}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            &times;
                        </button>
                        <h3 style={{ marginTop: 0, color: '#1565c0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💡</span> 제안서 다운로드 기능 사용법
                        </h3>
                        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1976d2' }}>STEP 1</div>
                                <p style={{ margin: 0, lineHeight: '1.5' }}>
                                    상품 카드의 <span style={{ color: '#e91e63', fontWeight: 'bold' }}>♥</span> 버튼을 클릭하여<br />
                                    제안서 목록에 상품을 담으세요.
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1976d2' }}>STEP 2</div>
                                <p style={{ margin: 0, lineHeight: '1.5' }}>
                                    우측 하단의 <span style={{ background: '#28a745', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' }}>📋 제안서 다운로드</span><br />
                                    버튼을 확인하세요.
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1976d2' }}>STEP 3</div>
                                <p style={{ margin: 0, lineHeight: '1.5' }}>
                                    버튼을 클릭하여 목록을 확인하고<br />
                                    <span style={{ fontWeight: 'bold' }}>엑셀 파일(.xlsx)</span>로 다운로드하세요.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })()}

            <div className="catalog-filters" style={{
                position: 'sticky',
                top: '80px', // Adjusted for Navbar height + spacing
                zIndex: 900,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #eee',
                marginBottom: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div className="category-list" style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    paddingBottom: '5px'
                }}>
                    <style>
                        {`
                            .category-list::-webkit-scrollbar {
                                display: none;
                            }
                            .category-btn {
                                white-space: nowrap;
                                padding: 8px 16px;
                                border-radius: 20px;
                                border: 1px solid #eee;
                                background: white;
                                cursor: pointer;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                font-size: 0.95rem;
                                color: #666;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            }
                            .category-btn:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            }
                            .category-count {
                                background: rgba(0,0,0,0.05);
                                padding: 2px 8px;
                                border-radius: 10px;
                                font-size: 0.8rem;
                            }
                        `}
                    </style>
                    <button
                        className="category-btn"
                        onClick={() => setSelectedCategory('')}
                        style={{
                            backgroundColor: selectedCategory === '' ? '#007bff' : 'white',
                            color: selectedCategory === '' ? 'white' : '#666',
                            borderColor: '#007bff'
                        }}
                    >
                        전체
                        <span className="category-count" style={{
                            background: selectedCategory === '' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                            color: selectedCategory === '' ? 'white' : 'inherit'
                        }}>{totalCount}</span>
                    </button>
                    {sortCategories(categories).map(cat => {
                        const catColor = getCategoryColor(cat.name);
                        const isActive = selectedCategory === cat.slug;

                        return (
                            <button
                                key={cat.id}
                                className="category-btn"
                                onClick={() => setSelectedCategory(cat.slug)}
                                style={{
                                    backgroundColor: isActive ? catColor : 'white',
                                    color: isActive ? 'white' : catColor,
                                    borderColor: catColor,
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    boxShadow: isActive ? `0 4px 12px ${catColor}40` : 'none'
                                }}
                            >
                                {cat.name}
                                <span className="category-count" style={{
                                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                    color: isActive ? 'white' : 'inherit'
                                }}>{cat.product_count || 0}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="filter-group" style={{ marginBottom: '2rem' }}>
                <label>검색</label>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="브랜드 또는 모델명 검색"
                />
            </div>

            <div className="products-grid">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onAddToProposal={addToProposal}
                        onRemoveFromProposal={removeFromProposal}
                        navigate={navigate}
                        user={user}
                        proposalItems={proposalItems}
                    />
                ))}
            </div>

            {
                products.length === 0 && (
                    <div className="no-products">조회된 상품이 없습니다</div>
                )
            }

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
                <span>📋 제안서 다운로드</span>
                <span style={{ background: 'white', color: '#28a745', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {proposalItems.length}
                </span>
            </div>

            {/* Proposal Modal */}
            {
                showProposalModal && (
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
                )
            }
        </div >
    )
}

function ProductCard({ product, onAddToCart, onAddToProposal, onRemoveFromProposal, navigate, user, proposalItems }) {
    const [isHovered, setIsHovered] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
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

        // Optional: Close after adding? Let's keep it open or close it.
        // User might want to add more. Let's keep it open but maybe give feedback.
        // For now, let's close it to indicate success and reset state.
        setIsLocked(false)
        setIsHovered(false)
    }

    const handleAddToProposal = (e) => {
        e.stopPropagation()
        if (isInProposal) {
            onRemoveFromProposal(product.id)
        } else {
            onAddToProposal(product)
        }
    }

    const showOptions = isHovered || isLocked

    return (
        <div
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="product-image-container">
                <div className={`product-image ${showOptions ? 'hovered' : ''}`}>
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.model_name} />
                    ) : (
                        <div className="no-image">No Image</div>
                    )}
                    {showOptions && (
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

            {!showOptions ? (
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLocked(true);
                                setIsHovered(true);
                            }}
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLocked(false);
                                setIsHovered(false);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#999', padding: '0 5px' }}
                            title="닫기"
                        >
                            &times;
                        </button>
                    </div>
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
