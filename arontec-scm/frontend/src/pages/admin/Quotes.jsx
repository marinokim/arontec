import { useState, useEffect } from 'react'

function AdminQuotes() {
    const [quotes, setQuotes] = useState([])

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/quotes')
        const data = await res.json()
        setQuotes(data.quotes)
    }

    const updateStatus = async (id, status) => {
        await fetch((import.meta.env.VITE_API_URL || '') + `/api/admin/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
        fetchQuotes()
    }

    return (
        <div className="catalog-page">
            <h1>견적 관리</h1>
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>견적번호</th>
                            <th>회사명</th>
                            <th>담당자</th>
                            <th>금액</th>
                            <th>상태</th>
                            <th>요청일</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map(quote => (
                            <tr key={quote.id}>
                                <td>{quote.quote_number}</td>
                                <td>{quote.company_name}</td>
                                <td>{quote.contact_person}</td>
                                <td>{quote.total_amount?.toLocaleString()}원</td>
                                <td>
                                    <span className={`badge badge-${quote.status}`}>
                                        {quote.status === 'pending' ? '대기중' : quote.status === 'approved' ? '승인' : '거절'}
                                    </span>
                                </td>
                                <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                                <td>
                                    {quote.status === 'pending' && (
                                        <>
                                            <button onClick={() => updateStatus(quote.id, 'approved')} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
                                                승인
                                            </button>
                                            <button onClick={() => updateStatus(quote.id, 'rejected')} className="btn btn-secondary">
                                                거절
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminQuotes
