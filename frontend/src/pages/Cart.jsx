
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Cart({ user }) {
    const [cartItems, setCartItems] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        if (user?.isAdmin) {
            alert('관리자는 장바구니를 이용할 수 없습니다.')
            navigate('/dashboard')
            return
        }
        fetchCart()
    }, [user])

    const fetchCart = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/cart', { credentials: 'include' })
        const data = await res.json()
        setCartItems(data.cart)
    }

    const updateQuantity = async (id, quantity) => {
        if (quantity < 1) return

        await fetch((import.meta.env.VITE_API_URL || '') + `/ api / cart / ${id} `, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ quantity })
        })

        fetchCart()
    }

    const removeItem = async (id) => {
        if (!confirm('삭제하시겠습니까?')) return

        await fetch((import.meta.env.VITE_API_URL || '') + `/ api / cart / ${id} `, { method: 'DELETE', credentials: 'include' })
        fetchCart()
    }

    const total = cartItems.reduce((sum, item) => sum + (parseInt(item.b2b_price) * item.quantity), 0)

    return (
        <div className="catalog-page">
            <div className="catalog-header">
                <h1>장바구니</h1>
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← 대시보드</button>
            </div>

            {cartItems.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>장바구니가 비어있습니다</p>
                    <button onClick={() => navigate('/catalog')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        상품 보러가기
                    </button>
                </div>
            ) : (
                <>
                    <div className="card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>상품</th>
                                    <th>단가</th>
                                    <th>수량</th>
                                    <th>소계</th>
                                    <th>삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.brand}</strong><br />
                                            {item.model_name}
                                        </td>
                                        <td>{parseInt(item.b2b_price).toLocaleString()}원</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn btn-secondary">-</button>
                                                <span style={{ minWidth: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn btn-secondary">+</button>
                                            </div>
                                        </td>
                                        <td>{(parseInt(item.b2b_price) * item.quantity).toLocaleString()}원</td>
                                        <td>
                                            <button onClick={() => removeItem(item.id)} className="btn btn-secondary">삭제</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <h2>총 금액: {total.toLocaleString()}원</h2>
                            <button onClick={() => navigate('/quote-request')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                견적 요청하기
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Cart
