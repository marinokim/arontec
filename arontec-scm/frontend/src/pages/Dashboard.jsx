import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

function Dashboard({ user }) {
    const [data, setData] = useState({ notifications: [], recentQuotes: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/dashboard', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setData(data)
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

    const handleLogout = async () => {
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST', credentials: 'include' })
        window.location.reload()
    }

    if (loading) return <div className="loading">로딩중...</div>

    return (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">ARONTEC KOREA B2B SCM</div>
                <div className="nav-links">
                    <Link to="/dashboard">대시보드</Link>
                    <Link to="/catalog">상품 카탈로그</Link>
                    <Link to="/cart">장바구니</Link>
                    <Link to="/mypage">내 정보</Link>
                    {user?.isAdmin && <Link to="/admin">관리자</Link>}
                    <button onClick={handleLogout} className="btn-logout">로그아웃</button>
                </div>
            </nav>

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

                <div className="quick-actions">
                    <Link to="/catalog" className="btn btn-primary">상품 둘러보기</Link>
                    <Link to="/cart" className="btn btn-secondary">장바구니 보기</Link>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
