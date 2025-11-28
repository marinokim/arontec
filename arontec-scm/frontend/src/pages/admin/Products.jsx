import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState('All')

    const initialFormState = {
        categoryId: '',
        brand: '',
        modelName: '',
        description: '',
        imageUrl: '',
        consumerPrice: '',
        supplyPrice: '',
        b2bPrice: '',
        stockQuantity: '',
        quantityPerCarton: '',
        shippingFee: '',
        isAvailable: true,
        detailUrl: ''
    }

    const [formData, setFormData] = useState(initialFormState)

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

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
        const number = value.toString().replace(/[^0-9]/g, '')
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        const baseUrl = import.meta.env.VITE_API_URL || ''
        const url = editingProduct ? `${baseUrl}/api/products/${editingProduct.id}` : `${baseUrl}/api/products`
        const method = editingProduct ? 'PUT' : 'POST'

        try {
            const payload = {
                ...formData,
                consumerPrice: parsePrice(formData.consumerPrice),
                supplyPrice: parsePrice(formData.supplyPrice),
                b2bPrice: parsePrice(formData.b2bPrice),
                stockQuantity: parsePrice(formData.stockQuantity),
                shippingFee: parsePrice(formData.shippingFee)
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert(editingProduct ? '상품이 수정되었습니다' : '상품이 등록되었습니다')
                setIsModalOpen(false)
                setEditingProduct(null)
                setFormData(initialFormState)
                fetchProducts()
            } else {
                const data = await res.json()
                alert(data.error || '오류가 발생했습니다')
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${id}`, { method: 'DELETE', credentials: 'include' })
            if (res.ok) {
                fetchProducts()
            } else {
                alert('삭제 실패')
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setFormData({
            categoryId: product.category_id,
            brand: product.brand,
            modelName: product.model_name,
            description: product.description || '',
            imageUrl: product.image_url || '',
            consumerPrice: formatPrice(product.consumer_price || ''),
            supplyPrice: formatPrice(product.supply_price || ''),
            b2bPrice: formatPrice(product.b2b_price),
            stockQuantity: formatPrice(product.stock_quantity),
            quantityPerCarton: product.quantity_per_carton || '',
            shippingFee: formatPrice(product.shipping_fee || ''),
            isAvailable: product.is_available,
            detailUrl: product.detail_url || ''
        })
        setIsModalOpen(true)
    }

    const openAddModal = () => {
        setEditingProduct(null)
        setFormData(initialFormState)
        setIsModalOpen(true)
    }

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">ARONTEC ADMIN</div>
                <div className="nav-links">
                    <Link to="/admin">대시보드</Link>
                    <Link to="/admin/members">회원 관리</Link>
                    <Link to="/admin/products" className="active">상품 관리</Link>
                    <Link to="/admin/quotes">견적 관리</Link>
                </div>
            </nav>

            <div className="dashboard-content container" style={{ maxWidth: '1600px' }}>
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
                    </div>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + 신규 상품 등록
                    </button>
                </div>

                <div className="card">
                    <table className="table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', width: '60px' }}>No.</th>
                                <th>이미지</th>
                                <th style={{ minWidth: '100px' }}>브랜드</th>
                                <th>상품명</th>
                                <th style={{ textAlign: 'right' }}>실판매가</th>
                                <th style={{ textAlign: 'right' }}>공급가(소가/공급)</th>
                                <th style={{ textAlign: 'right' }}>재고(재고/카톤)</th>
                                <th style={{ textAlign: 'right' }}>배송비</th>
                                <th>등록일</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products
                                .filter(p => selectedCategory === 'All' || p.category_id === parseInt(selectedCategory))
                                .map(product => (
                                    <tr key={product.id}>
                                        <td style={{ textAlign: 'center' }}>{product.id}</td>
                                        <td>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.model_name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ width: '80px', height: '80px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.8rem' }}>No Img</div>
                                            )}
                                        </td>
                                        <td>{product.brand}</td>
                                        <td>
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '4px' }}>
                                                {product.category_name}
                                            </div>
                                            <div style={{ fontWeight: '500' }}>
                                                {product.model_name}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: '#007bff', textAlign: 'right', fontSize: '1.1rem' }}>
                                            {parseInt(product.b2b_price).toLocaleString()}
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
                                        <td style={{ textAlign: 'right' }}>{product.shipping_fee ? parseInt(product.shipping_fee).toLocaleString() : '0'}</td>
                                        <td>{new Date(product.created_at).toLocaleDateString()}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <span className={`badge ${product.is_available ? 'badge-success' : 'badge-danger'}`}>
                                                {product.is_available ? '판매중' : '품절/중지'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => openEditModal(product)} className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                                수정
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#dc3545', border: 'none', color: 'white', borderRadius: '4px' }}>
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
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
                                    value={formData.brand}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>모델명</label>
                                <input
                                    type="text"
                                    value={formData.modelName}
                                    onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                    required
                                />
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
                                <label>배송비</label>
                                <input
                                    type="text"
                                    value={formData.shippingFee}
                                    onChange={e => handlePriceChange('shippingFee', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>이미지 URL</label>
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="form-group">
                                <label>상세페이지 URL</label>
                                <input
                                    type="text"
                                    value={formData.detailUrl}
                                    onChange={e => setFormData({ ...formData, detailUrl: e.target.value })}
                                    placeholder="https://example.com/product/123"
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
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    /> 판매 가능 여부
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>저장</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminProducts
