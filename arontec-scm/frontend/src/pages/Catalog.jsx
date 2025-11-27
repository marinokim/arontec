import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Catalog.css'

function Catalog() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetchCategories()
        fetchProducts()
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

    const addToCart = async (productId, quantity) => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ productId, quantity })
            })

            if (res.ok) {
                alert('장바구니에 추가되었습니다')
            }
        } catch (error) {
            console.error('Add to cart error:', error)
        }
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
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} navigate={navigate} />
                ))}
            </div>

            {products.length === 0 && (
                <div className="no-products">조회된 상품이 없습니다</div>
            )}
        </div>
    )
}

function ProductCard({ product, onAddToCart, navigate }) {
    const [quantity, setQuantity] = useState(1)

    return (
        <div
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
            style={{ cursor: 'pointer' }}
        >
            <div className="product-image">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.model_name} />
                ) : (
                    <div className="no-image">No Image</div>
                )}
            </div>
            <div className="product-info">
                <h3>{product.brand}</h3>
                <p className="model">{product.model_name}</p>
                <p className="price">{parseInt(product.b2b_price).toLocaleString()}원</p>
            </div>
            <div className="product-actions" onClick={e => e.stopPropagation()} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '60px', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button
                    className="btn btn-primary"
                    onClick={() => onAddToCart(product.id, quantity)}
                    style={{ flex: 1 }}
                >
                    담기
                </button>
            </div>
        </div>
    )
}

export default Catalog
