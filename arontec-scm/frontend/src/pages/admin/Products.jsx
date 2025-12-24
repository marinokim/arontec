import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [brands, setBrands] = useState([])
    const [manufacturers, setManufacturers] = useState([])
    const [origins, setOrigins] = useState([])
    const [editingProduct, setEditingProduct] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const categoryColors = {
        'Audio': '#4e73df',   // Blue
        'Living': '#1cc88a',  // Green
        'Mobile': '#f6c23e',  // Yellow/Orange
        'Food': '#e74a3b',    // Red
        'Beauty': '#e83e8c',  // Pink
        'Other': '#858796'    // Gray
    }

    const initialFormState = {
        categoryId: '',
        brand: '',
        modelName: '', // This is now "Product Name"
        modelNo: '',   // This is the new "Model Name"
        description: '',
        imageUrl: '',
        consumerPrice: '',
        supplyPrice: '',
        b2bPrice: '',
        stockQuantity: '',
        quantityPerCarton: '',
        shippingFeeIndividual: '',
        shippingFeeCarton: '',
        productOptions: '',
        manufacturer: '',
        origin: '',
        isAvailable: true,
        isTaxFree: false,
        detailUrl: '',
        remarks: ''
    }

    const [formData, setFormData] = useState(initialFormState)

    useEffect(() => {
        fetchProducts()
        fetchCategories()
        fetchBrands()
        fetchManufacturers()
        fetchOrigins()
    }, [])

    const fetchBrands = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/brands', { credentials: 'include' })
            const data = await res.json()
            setBrands(data.brands)
        } catch (error) {
            console.error('Fetch brands error:', error)
        }
    }

    const fetchManufacturers = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/manufacturers', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setManufacturers(data.manufacturers || [])
            } else {
                setManufacturers([])
            }
        } catch (error) {
            console.error('Fetch manufacturers error:', error)
            setManufacturers([])
        }
    }

    const fetchOrigins = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/origins', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setOrigins(data.origins || [])
            } else {
                setOrigins([])
            }
        } catch (error) {
            console.error('Fetch origins error:', error)
            setOrigins([])
        }
    }

    const fetchProducts = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products', { credentials: 'include' })
        const data = await res.json()
        setProducts(data.products)
    }

    const fetchCategories = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories', { credentials: 'include' })
        const data = await res.json()
        setCategories(data.categories)
    }

    const formatPrice = (value) => {
        if (!value) return ''
        // Handle numeric values that might have decimals (e.g. 3000.00 from DB)
        const stringValue = typeof value === 'number' ? Math.floor(value).toString() : value.toString()
        // If string contains decimal, take integer part
        const integerPart = stringValue.split('.')[0]
        const number = integerPart.replace(/[^0-9]/g, '')
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const parsePrice = (value) => {
        if (!value) return ''
        return value.toString().replace(/,/g, '')
    }

    const handlePriceChange = (field, value) => {
        const formatted = formatPrice(value)
        setFormData({ ...formData, [field]: formatted })
    }

    const extractImageFromHtml = async (url) => {
        if (!url || !url.match(/\.html?$/i)) return null

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/proxy-image?url=${encodeURIComponent(url)}`)
            if (res.ok) {
                const html = await res.text()
                const match = html.match(/<img[^>]+src=['"]([^'"]+)['"]/)
                if (match && match[1]) {
                    let imgUrl = match[1]
                    if (!imgUrl.startsWith('http')) {
                        // Resolve relative URL
                        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
                        imgUrl = new URL(imgUrl, baseUrl).href
                    }
                    return imgUrl
                }
            }
        } catch (error) {
            console.error('Failed to extract image from HTML:', error)
        }
        return null
    }

    const extractAllImagesFromHtml = async (url) => {
        if (!url || !url.match(/\.html?$/i)) return null

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/proxy-image?url=${encodeURIComponent(url)}`)
            if (res.ok) {
                const html = await res.text()
                console.log('Fetched HTML length:', html.length)

                // More robust regex: case insensitive, handles spaces around =
                const regex = /<img\s+[^>]*src\s*=\s*['"]([^'"]+)['"]/gi
                const matches = []
                let match
                while ((match = regex.exec(html)) !== null) {
                    let imgUrl = match[1]
                    if (!imgUrl.startsWith('http')) {
                        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
                        imgUrl = new URL(imgUrl, baseUrl).href
                    }
                    matches.push(imgUrl)
                }

                console.log(`Found ${matches.length} images in HTML`)

                if (matches.length > 0) {
                    // Convert to HTML tags as requested
                    return matches.map(imgUrl => `<img src="${imgUrl}"><br>`).join('')
                }
            }
        } catch (error) {
            console.error('Failed to extract images from HTML:', error)
        }
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const baseUrl = import.meta.env.VITE_API_URL || ''
        const url = editingProduct ? `${baseUrl}/api/products/${editingProduct.id}` : `${baseUrl}/api/products`
        const method = editingProduct ? 'PUT' : 'POST'

        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            let finalImageUrl = formData.imageUrl
            // Check for <img src="..."> tag first
            const imgTagSrc = finalImageUrl && finalImageUrl.match(/<img[^>]+src=['"]([^'"]+)['"]/i)
            if (imgTagSrc && imgTagSrc[1]) {
                finalImageUrl = imgTagSrc[1]
            } else if (finalImageUrl && finalImageUrl.match(/\.html?$/i)) {
                const extractedUrl = await extractImageFromHtml(finalImageUrl)
                if (extractedUrl) {
                    finalImageUrl = extractedUrl
                }
            }

            let finalDetailUrl = formData.detailUrl
            if (finalDetailUrl && finalDetailUrl.match(/\.html?$/i)) {
                const extractedHtml = await extractAllImagesFromHtml(finalDetailUrl)
                if (extractedHtml) {
                    finalDetailUrl = extractedHtml
                }
            }

            const payload = {
                ...formData,
                imageUrl: finalImageUrl,
                detailUrl: finalDetailUrl,
                consumerPrice: parsePrice(formData.consumerPrice),
                supplyPrice: parsePrice(formData.supplyPrice),
                b2bPrice: parsePrice(formData.b2bPrice),
                b2bPrice: parsePrice(formData.b2bPrice),
                stockQuantity: parsePrice(formData.stockQuantity),
                quantityPerCarton: formData.quantityPerCarton ? formData.quantityPerCarton : '0',
                shippingFeeIndividual: formData.shippingFeeIndividual ? parsePrice(formData.shippingFeeIndividual) : '0',
                shippingFeeCarton: formData.shippingFeeCarton ? parsePrice(formData.shippingFeeCarton) : '0',
                // Keep legacy shippingFee for compatibility if needed, or remove it. Let's set it to individual fee for now.
                shippingFee: formData.shippingFeeIndividual ? parsePrice(formData.shippingFeeIndividual) : '0',
                productOptions: formData.productOptions,
                // Remove double quotes from text fields as requested
                modelName: formData.modelName ? formData.modelName.replace(/"/g, '') : '',
                modelNo: formData.modelNo ? formData.modelNo.replace(/"/g, '') : '',
                manufacturer: formData.manufacturer ? formData.manufacturer.replace(/"/g, '') : '',
                origin: formData.origin ? formData.origin.replace(/"/g, '') : '',
                isTaxFree: formData.isTaxFree,
                remarks: formData.remarks ? formData.remarks.replace(/"/g, '') : '',
                productOptions: formData.productOptions ? formData.productOptions.replace(/"/g, '') : '',
                description: formData.description ? formData.description.replace(/"/g, '') : ''
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert(editingProduct ? '상품이 수정되었습니다' : '상품이 등록되었습니다')
                setShowModal(false)
                setEditingProduct(null)
                setFormData(initialFormState)
                fetchProducts()
                fetchBrands()
                fetchManufacturers()
                fetchOrigins()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                const data = await res.json()
                alert(data.error || '오류가 발생했습니다')
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('오류가 발생했습니다')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${id}`, { method: 'DELETE', credentials: 'include' })
            if (res.ok) {
                fetchProducts()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('삭제 실패')
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleToggleAvailability = async (product) => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${product.id}/availability`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isAvailable: !product.is_available })
            })

            if (res.ok) {
                setProducts(products.map(p =>
                    p.id === product.id ? { ...p, is_available: !p.is_available } : p
                ))
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                const data = await res.json()
                alert(data.error || '상태 변경 실패')
            }
        } catch (error) {
            console.error('Toggle availability error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setFormData({
            categoryId: product.category_id,
            brand: product.brand,
            modelName: product.model_name,
            modelNo: product.model_no || '',
            description: product.description || '',
            imageUrl: product.image_url || '',
            consumerPrice: formatPrice(product.consumer_price || ''),
            supplyPrice: formatPrice(product.supply_price || ''),
            b2bPrice: formatPrice(product.b2b_price),
            stockQuantity: formatPrice(product.stock_quantity),
            quantityPerCarton: product.quantity_per_carton || '',
            shippingFeeIndividual: formatPrice(product.shipping_fee_individual || product.shipping_fee || ''),
            shippingFeeCarton: formatPrice(product.shipping_fee_carton || ''),
            productOptions: product.product_options || '',
            manufacturer: product.manufacturer || '',
            origin: product.origin || '',
            isAvailable: product.is_available,
            isTaxFree: product.is_tax_free || false,
            detailUrl: product.detail_url || '',
            remarks: product.remarks || ''
        })
        setShowModal(true)
    }

    const openAddModal = () => {
        setEditingProduct(null)
        setFormData(initialFormState)
        setShowModal(true)
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newCategoryName })
            })

            if (res.ok) {
                alert('카테고리가 추가되었습니다')
                setNewCategoryName('')
                setShowCategoryModal(false)
                fetchCategories()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('카테고리 추가 실패')
            }
        } catch (error) {
            console.error('Add category error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const handleLogout = async () => {
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.href = '/login'
    }

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">ARONTEC KOREA ADMIN</div>
                <div className="nav-links">
                    <Link to="/admin">대시보드</Link>
                    <Link to="/admin/members">회원 관리</Link>
                    <Link to="/admin/products" className="active">상품 관리</Link>
                    <Link to="/admin/quotes">견적 관리</Link>
                    <Link to="/admin/notifications">공지사항</Link>
                    <Link to="/dashboard">사용자 모드</Link>
                    <button onClick={handleLogout} className="btn-logout">로그아웃</button>
                </div>
            </nav>

            <div className="dashboard-content container" style={{ maxWidth: '100%' }}>
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>상품 관리</h1>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="All">전체 카테고리</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                            + 카테고리 추가
                        </button>
                    </div>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + 신규 상품 등록
                    </button>
                </div>

                <div className="card">
                    <div className="table-responsive">
                        <table className="table" style={{ fontSize: '0.85rem', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center', width: '60px' }}>No.</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>IMG</th>
                                    <th style={{ minWidth: '100px' }}>브랜드</th>
                                    <th style={{ minWidth: '250px' }}>상품명/모델명/옵션</th>
                                    <th style={{ textAlign: 'right' }}>실판매가</th>
                                    <th style={{ textAlign: 'right', minWidth: '140px' }}>공급가</th>
                                    <th style={{ textAlign: 'right', minWidth: '120px' }}>재고</th>
                                    <th style={{ textAlign: 'right', minWidth: '100px' }}>배송비</th>
                                    <th>제조사/원산지/등록일</th>
                                    <th style={{ textAlign: 'center', minWidth: '120px' }}>상태/관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products
                                    .filter(p => selectedCategory === 'All' || p.category_id === parseInt(selectedCategory))
                                    .map(product => (
                                        <tr key={product.id}>
                                            <td style={{ textAlign: 'center' }}>{product.id}</td>
                                            <td style={{ padding: 0, width: '100px' }}>
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.model_name} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>No Img</div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: product.brand.length > 6 ? '0.75rem' : 'inherit'
                                                }}>
                                                    {product.brand}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: categoryColors[product.category_name] || '#666', marginTop: '4px' }}>
                                                    {product.category_name}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>
                                                    {product.model_name}
                                                </div>
                                                {product.model_no && (
                                                    <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '2px' }}>
                                                        {product.model_no}
                                                    </div>
                                                )}
                                                {product.product_options && (
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                                        {product.product_options}
                                                    </div>
                                                )}
                                                {product.remarks && (
                                                    <div style={{
                                                        marginTop: '4px',
                                                        color: '#d63384',
                                                        fontSize: '0.7rem',
                                                        lineHeight: '1.2',
                                                        fontWeight: 'normal',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {product.remarks}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#007bff', fontSize: '1.1rem' }}>
                                                    {parseInt(product.b2b_price).toLocaleString()}
                                                </div>
                                                <div style={{ marginTop: '2px' }}>
                                                    <span className={`badge ${product.is_tax_free ? 'badge-info' : 'badge-secondary'}`} style={{ background: product.is_tax_free ? '#17a2b8' : '#6c757d', fontSize: '0.7rem', padding: '2px 4px' }}>
                                                        {product.is_tax_free ? '면세' : '과세'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                                                    <span>소가</span>
                                                    <span style={{ textDecoration: 'line-through' }}>{product.consumer_price ? parseInt(product.consumer_price).toLocaleString() : '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>공급</span>
                                                    <span>{product.supply_price ? parseInt(product.supply_price).toLocaleString() : '-'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>재고</span>
                                                    <span>{parseInt(product.stock_quantity).toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>카톤</span>
                                                    <span>{product.quantity_per_carton || '-'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>개별</span>
                                                    <span>{product.shipping_fee_individual ? parseInt(product.shipping_fee_individual).toLocaleString() : (product.shipping_fee ? parseInt(product.shipping_fee).toLocaleString() : '0')}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>카톤</span>
                                                    <span>{product.shipping_fee_carton ? parseInt(product.shipping_fee_carton).toLocaleString() : '0'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{
                                                    fontSize: product.manufacturer && product.manufacturer.length > 8 ? '0.75rem' : '0.85rem',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    <span style={{ color: '#666', marginRight: '4px' }}>제조사:</span>
                                                    {product.manufacturer}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                                    <span style={{ marginRight: '4px' }}>원산지:</span>
                                                    {product.origin}
                                                </div>
                                                <div style={{ color: '#999', fontSize: '0.75rem' }}>
                                                    <span style={{ marginRight: '4px' }}>등록일:</span>
                                                    {new Date(product.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <span
                                                        className={`badge ${product.is_available ? 'badge-success' : 'badge-danger'}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleToggleAvailability(product)}
                                                        title="클릭하여 상태 변경"
                                                    >
                                                        {product.is_available ? '판매중' : '중지'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <button onClick={() => openEditModal(product)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                                        수정
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#dc3545', border: 'none', color: 'white', borderRadius: '4px' }}>
                                                        삭제
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2>{editingProduct ? '상품 수정' : '신규 상품 등록'}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>카테고리</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">선택하세요</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>브랜드</label>
                                <input
                                    type="text"
                                    list="brand-list"
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    required
                                    placeholder="브랜드를 선택하거나 직접 입력하세요"
                                />
                                <datalist id="brand-list">
                                    {brands.map((brand, index) => (
                                        <option key={index} value={brand} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>상품명</label>
                                <input
                                    type="text"
                                    value={formData.modelName}
                                    onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>모델명</label>
                                <input
                                    type="text"
                                    value={formData.modelNo}
                                    onChange={e => setFormData({ ...formData, modelNo: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>제조사</label>
                                <input
                                    type="text"
                                    list="manufacturer-list"
                                    value={formData.manufacturer}
                                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                                    placeholder="예: Samsung, LG..."
                                />
                                <datalist id="manufacturer-list">
                                    {manufacturers.map((item, index) => (
                                        <option key={index} value={item} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>원산지</label>
                                <input
                                    type="text"
                                    list="origin-list"
                                    value={formData.origin}
                                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    placeholder="예: Korea, China..."
                                />
                                <datalist id="origin-list">
                                    {origins.map((item, index) => (
                                        <option key={index} value={item} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="form-group">
                                <label>소비자가</label>
                                <input
                                    type="text"
                                    value={formData.consumerPrice}
                                    onChange={e => handlePriceChange('consumerPrice', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>공급가</label>
                                <input
                                    type="text"
                                    value={formData.supplyPrice}
                                    onChange={e => handlePriceChange('supplyPrice', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>실판매가 (B2B)</label>
                                <input
                                    type="text"
                                    value={formData.b2bPrice}
                                    onChange={e => handlePriceChange('b2bPrice', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>재고 수량</label>
                                <input
                                    type="text"
                                    value={formData.stockQuantity}
                                    onChange={e => handlePriceChange('stockQuantity', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>카톤별 수량</label>
                                <input
                                    type="number"
                                    value={formData.quantityPerCarton}
                                    onChange={e => setFormData({ ...formData, quantityPerCarton: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>배송비 (개별)</label>
                                <input
                                    type="text"
                                    value={formData.shippingFeeIndividual}
                                    onChange={e => handlePriceChange('shippingFeeIndividual', e.target.value)}
                                    placeholder="개별 배송비"
                                />
                            </div>

                            <div className="form-group">
                                <label>배송비 (카톤)</label>
                                <input
                                    type="text"
                                    value={formData.shippingFeeCarton}
                                    onChange={e => handlePriceChange('shippingFeeCarton', e.target.value)}
                                    placeholder="카톤 배송비"
                                />
                            </div>

                            <div className="form-group">
                                <label>옵션 (선택사항)</label>
                                <textarea
                                    value={formData.productOptions}
                                    onChange={e => setFormData({ ...formData, productOptions: e.target.value })}
                                    rows="2"
                                    placeholder="예: 블랙, 화이트, 레드 (쉼표로 구분)"
                                />
                            </div>

                            <div className="form-group">
                                <label>이미지 URL</label>
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    onBlur={async (e) => {
                                        const url = e.target.value
                                        // Check for <img src="..."> tag
                                        const imgTagMatch = url.match(/<img[^>]+src=['"]([^'"]+)['"]/i)
                                        if (imgTagMatch && imgTagMatch[1]) {
                                            setFormData(prev => ({ ...prev, imageUrl: imgTagMatch[1] }))
                                            alert('이미지 태그에서 URL을 추출했습니다.')
                                            return
                                        }

                                        const extractedUrl = await extractImageFromHtml(url)
                                        if (extractedUrl) {
                                            setFormData(prev => ({ ...prev, imageUrl: extractedUrl }))
                                            alert('HTML에서 이미지 URL을 추출했습니다.')
                                        }
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>상세페이지 URL</label>
                                <input
                                    type="text"
                                    value={formData.detailUrl}
                                    onChange={e => setFormData({ ...formData, detailUrl: e.target.value })}
                                    placeholder="https://example.com/product/123"
                                    onBlur={async (e) => {
                                        const url = e.target.value
                                        const extractedHtml = await extractAllImagesFromHtml(url)
                                        if (extractedHtml) {
                                            setFormData(prev => ({ ...prev, detailUrl: extractedHtml }))
                                            const count = (extractedHtml.match(/<img/g) || []).length
                                            alert(`HTML에서 ${count}장의 이미지를 추출하여 태그로 변환했습니다.`)
                                        }
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>상세 설명</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>비고</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    rows="2"
                                    placeholder="비고 사항을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <span>판매 가능 여부</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>과세 여부</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="taxStatus"
                                            checked={!formData.isTaxFree}
                                            onChange={() => setFormData({ ...formData, isTaxFree: false })}
                                            style={{ width: 'auto', margin: 0 }}
                                        />
                                        <span>과세</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="taxStatus"
                                            checked={formData.isTaxFree}
                                            onChange={() => setFormData({ ...formData, isTaxFree: true })}
                                            style={{ width: 'auto', margin: 0 }}
                                        />
                                        <span>면세</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                                    {isSubmitting ? '저장 중...' : '저장'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }} disabled={isSubmitting}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCategoryModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px'
                    }}>
                        <h3>새 카테고리 추가</h3>
                        <form onSubmit={handleAddCategory} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>카테고리명</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    required
                                    placeholder="예: Audio, Living..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>추가</button>
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminProducts
