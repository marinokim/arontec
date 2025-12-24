import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './Catalog.css' // Reuse catalog styles or create new ones

function ProductDetail({ user }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [proposalItems, setProposalItems] = useState([])

    useEffect(() => {
        const savedProposal = localStorage.getItem('proposalItems')
        if (savedProposal) {
            setProposalItems(JSON.parse(savedProposal))
        }
    }, [])

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/products/${id}`, { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setProduct(data.product)
                } else {
                    setError('Product not found')
                }
            } catch (err) {
                console.error('Error fetching product:', err)
                setError('Failed to load product')
            } finally {
                setLoading(false)
            }
        }

        fetchProduct()
    }, [id])

    const addToCart = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ productId: product.id, quantity })
            })

            if (res.ok) {
                alert('장바구니에 추가되었습니다')
            }
        } catch (error) {
            console.error('Add to cart error:', error)
        }
    }

    const addToProposal = () => {
        if (proposalItems.find(item => item.id === product.id)) {
            alert('이미 제안서 목록에 있는 상품입니다.')
            return
        }
        const newItems = [...proposalItems, product]
        setProposalItems(newItems)
        localStorage.setItem('proposalItems', JSON.stringify(newItems))
        alert('제안서 목록에 추가되었습니다.')
    }

    if (loading) return <div className="loading">Loading...</div>
    if (error) return <div className="error">{error}</div>
    if (!product) return null

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">ARONTEC KOREA SCM</div>
                <div className="nav-links">
                    <button onClick={() => navigate('/dashboard')} className="nav-link">대시보드</button>
                    <button onClick={() => navigate('/catalog')} className="nav-link active">상품 카탈로그</button>
                    <button onClick={() => navigate('/cart')} className="nav-link">장바구니</button>
                    <button onClick={() => navigate('/quote-request')} className="nav-link">견적 요청</button>
                    <button onClick={() => navigate('/mypage')} className="nav-link">마이페이지</button>
                </div>
            </nav>

            <div className="dashboard-content container">
                <div className="dashboard-header">
                    <button onClick={() => navigate('/catalog')} className="btn btn-secondary">
                        &larr; 목록으로 돌아가기
                    </button>
                </div>

                <div className="card" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginBottom: '40px' }}>
                        <div style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.model_name}
                                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ width: '300px', height: '300px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No Image
                                </div>
                            )}
                        </div>
                        <div style={{ flex: '1', minWidth: '300px' }}>
                            <span className="badge badge-primary" style={{ marginBottom: '10px', display: 'inline-block' }}>
                                {product.category_name}
                            </span>
                            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>{product.model_name}</h1>
                            <h3 style={{ color: '#666', marginBottom: '20px' }}>{product.brand}</h3>
                            <h2 style={{ color: '#007bff', marginBottom: '20px' }}>
                                <p className="product-price">{parseInt(product.b2b_price).toLocaleString()}원</p>
                            </h2>
                            {product.remarks && (
                                <p style={{
                                    color: '#d63384',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4',
                                    marginBottom: '20px',
                                    fontWeight: 'normal',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {product.remarks}
                                </p>
                            )}
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555', marginBottom: '30px' }}>
                                {product.description}
                            </p>

                            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <p><strong>재고:</strong> {product.stock_quantity}개</p>
                                <p><strong>상태:</strong> {product.is_available ? '판매중' : '품절/중지'}</p>
                            </div>

                            <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{ width: '80px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={addToCart}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', padding: '10px' }}
                                    >
                                        <span style={{ fontSize: '1.4rem' }}>🛒</span> 장바구니 담기
                                    </button>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={addToProposal}
                                    style={{ width: '100%', background: '#28a745', padding: '10px', fontSize: '1.1rem' }}
                                >
                                    제안서 담기
                                </button>
                            </div>
                        </div>
                    </div>

                    {product.detail_url && (
                        <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', borderLeft: '4px solid #007bff', paddingLeft: '10px' }}>
                                상세 정보
                            </h3>
                            {(() => {
                                const detailUrl = product.detail_url;
                                // Check for HTML tags
                                if (/<[a-z][\s\S]*>/i.test(detailUrl)) {
                                    return (
                                        <div
                                            className="product-detail-content"
                                            dangerouslySetInnerHTML={{ __html: detailUrl }}
                                            style={{ margin: '0 auto' }}
                                        />
                                    );
                                }
                                // Check for comma-separated URLs
                                const urls = detailUrl.split(',').map(u => u.trim()).filter(u => u);
                                if (urls.length > 1) {
                                    return (
                                        <div className="product-detail-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                                            {urls.map((url, index) => (
                                                <img
                                                    key={index}
                                                    src={url}
                                                    alt={`Detailed Description ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    );
                                }
                                // Fallback to single image
                                return (
                                    <div className="product-detail-content">
                                        <img
                                            src={detailUrl}
                                            alt="Detailed Description"
                                        />
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductDetail
