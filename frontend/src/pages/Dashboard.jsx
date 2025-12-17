import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

import Navbar from '../components/Navbar'

function Dashboard({ user }) {
    const [data, setData] = useState({ notifications: [], recentQuotes: [], newProducts: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/dashboard', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()

                // Fetch new products
                const productRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/products?isNew=true&limit=5', { credentials: 'include' })
                const productData = await productRes.json()

                setData({ ...data, newProducts: productData.products || [] })
            } else {
                // If session expired or invalid, redirect to login
                if (res.status === 401) {
                    window.location.href = '/login'
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="loading">로딩중...</div>

    return (
        <div className="dashboard">
            <Navbar user={user} />

            <div className="dashboard-content container">
                <div className="dashboard-header">
                    <h1>환영합니다, {user?.contactPerson}님</h1>
                    <p>{user?.companyName}</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>📢 공지사항</h3>
                        {data.notifications.length === 0 ? (
                            <p className="text-muted">공지사항이 없습니다</p>
                        ) : (
                            <ul className="notification-list">
                                {data.notifications.map(notif => (
                                    <li key={notif.id}>
                                        <strong>{notif.title}</strong>
                                        <p>{notif.content}</p>
                                        <small>{new Date(notif.created_at).toLocaleDateString()}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="dashboard-card">
                        <h3>📋 최근 견적 요청</h3>
                        {data.recentQuotes.length === 0 ? (
                            <p className="text-muted">견적 요청 내역이 없습니다</p>
                        ) : (
                            <table className="table-simple">
                                <thead>
                                    <tr>
                                        <th>견적번호</th>
                                        <th>금액</th>
                                        <th>상태</th>
                                        <th>날짜</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentQuotes.map(quote => (
                                        <tr key={quote.id}>
                                            <td>{quote.quote_number}</td>
                                            <td>{parseInt(quote.total_amount).toLocaleString()}원</td>
                                            <td>
                                                <span className={`badge badge-${quote.status}`}>
                                                    {quote.status === 'pending' ? '대기중' : quote.status === 'approved' ? '승인' : '거절'}
                                                </span>
                                            </td>
                                            <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* New Products Section */}
                <div className="dashboard-card" style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>✨ 신상품</h3>
                        <Link to="/catalog" style={{
                            fontSize: '1rem',
                            color: '#fff',
                            background: '#007bff',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            전체상품 둘러보기 &gt;
                        </Link>
                    </div>

                    {data.newProducts && data.newProducts.length > 0 ? (
                        <div className="new-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {data.newProducts.map(product => (
                                <Link to={`/product/${product.id}`} key={product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', transition: 'transform 0.2s' }}>
                                        <div style={{ height: '150px', overflow: 'hidden', background: '#f8f9fa' }}>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.model_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>No Image</div>
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.2rem' }}>{product.brand}</div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.model_name}</div>
                                            <div style={{ color: '#007bff', fontWeight: 'bold' }}>{parseInt(product.b2b_price).toLocaleString()}원</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">등록된 신상품이 없습니다.</p>
                    )}
                </div>

                <div className="quick-actions" style={{ marginTop: '2rem' }}>
                    <Link to="/catalog" className="btn btn-primary" style={{
                        padding: '1.5rem 4rem',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #0061f2 0%, #00c6ff 100%)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        borderRadius: '50px',
                        transition: 'transform 0.3s ease'
                    }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span style={{ fontSize: '1.8rem' }}>🔍</span> 전체상품 둘러보기
                    </Link>
                    <Link to="/cart" className="btn btn-secondary" style={{
                        padding: '1.5rem 3rem',
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#6c757d',
                        borderRadius: '50px'
                    }}>
                        <span>🛒</span> 장바구니 보기
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
