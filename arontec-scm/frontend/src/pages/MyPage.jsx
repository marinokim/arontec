import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MyPage({ user }) {
    const [quotes, setQuotes] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/quotes', { credentials: 'include' })
        const data = await res.json()
        setQuotes(data.quotes)
    }

    return (
        <div className="catalog-page">
            <div className="catalog-header">
                <h1>내 정보</h1>
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← 대시보드</button>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2>회사 정보</h2>
                <div style={{ marginTop: '1rem' }}>
                    <p><strong>이메일:</strong> {user?.email}</p>
                    <p><strong>회사명:</strong> {user?.companyName}</p>
                    <p><strong>담당자:</strong> {user?.contactPerson}</p>
                </div>
            </div>

            <div className="card">
                <h2>견적 요청 이력</h2>
                {quotes.length === 0 ? (
                    <p className="text-muted">견적 이력이 없습니다</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>견적번호</th>
                                <th>금액</th>
                                <th>납기일</th>
                                <th>상태</th>
                                <th>요청일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id}>
                                    <td>{quote.quote_number}</td>
                                    <td>{quote.total_amount?.toLocaleString()}원</td>
                                    <td>{quote.delivery_date && new Date(quote.delivery_date).toLocaleDateString()}</td>
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
    )
}

export default MyPage
