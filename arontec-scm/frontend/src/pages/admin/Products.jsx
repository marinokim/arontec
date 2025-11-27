import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)

    const initialFormState = {
        categoryId: '',
        brand: '',
        modelName: '',
        description: '',
        imageUrl: '',
        b2bPrice: '',
        stockQuantity: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault()

        const baseUrl = import.meta.env.VITE_API_URL || ''
        const url = editingProduct ? `${baseUrl}/api/products/${editingProduct.id}` : `${baseUrl}/api/products`
        const method = editingProduct ? 'PUT' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
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
            b2bPrice: product.b2b_price,
            stockQuantity: product.stock_quantity,
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

            <div className="dashboard-content container">
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>상품 관리</h1>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + 신규 상품 등록
                    </button>
                </div>

                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>이미지</th>
                                <th style={{ minWidth: '150px' }}>브랜드</th>
                                <th>모델명</th>
                                <th style={{ minWidth: '100px' }}>카테고리</th>
                                <th>가격</th>
                                <th>재고</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.model_name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Img</div>
                                        )}
                                    </td>
                                    <td>{product.brand}</td>
                                    <td>{product.model_name}</td>
                                    <td>{product.category_name}</td>
                                    <td>{parseInt(product.b2b_price).toLocaleString()}원</td>
                                    <td>{product.stock_quantity}</td>
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
                                <label>B2B 공급가</label>
                                <input
                                    type="number"
                                    value={formData.b2bPrice}
                                    onChange={e => setFormData({ ...formData, b2bPrice: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>재고 수량</label>
                                <input
                                    type="number"
                                    value={formData.stockQuantity}
                                    onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
                                    required
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
