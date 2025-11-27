import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MyPage({ user }) {
    const [selectedQuote, setSelectedQuote] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchQuoteDetail = async (id) => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/quotes/${id}`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setSelectedQuote(data)
                setIsModalOpen(true)
            } else {
                alert('견적 상세 정보를 불러오는데 실패했습니다.')
            }
        } catch (error) {
            console.error('Error fetching quote detail:', error)
        }
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
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id}>
                                    <td>{quote.quote_number}</td>
                                    <td>{parseInt(quote.total_amount).toLocaleString()}원</td>
                                    <td>{quote.delivery_date && new Date(quote.delivery_date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge badge-${quote.status}`}>
                                            {quote.status === 'pending' ? '대기중' : quote.status === 'approved' ? '승인' : '거절'}
                                        </span>
                                    </td>
                                    <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            onClick={() => fetchQuoteDetail(quote.id)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                        >
                                            상세보기
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && selectedQuote && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '800px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>견적서 상세 ({selectedQuote.quote.quote_number})</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p><strong>요청일:</strong> {new Date(selectedQuote.quote.created_at).toLocaleDateString()}</p>
                                <p><strong>납기일:</strong> {selectedQuote.quote.delivery_date ? new Date(selectedQuote.quote.delivery_date).toLocaleDateString() : '-'}</p>
                            </div>
                            <div>
                                <p><strong>상태:</strong> <span className={`badge badge-${selectedQuote.quote.status}`}>
                                    {selectedQuote.quote.status === 'pending' ? '대기중' : selectedQuote.quote.status === 'approved' ? '승인' : '거절'}
                                </span></p>
                                <p><strong>총 금액:</strong> <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0056b3' }}>{parseInt(selectedQuote.quote.total_amount).toLocaleString()}원</span></p>
                            </div>
                        </div>

                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>브랜드</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>모델명</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>단가</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>수량</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>합계</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedQuote.items.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '0.75rem' }}>{item.brand}</td>
                                        <td style={{ padding: '0.75rem' }}>{item.model_name}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{parseInt(item.unit_price).toLocaleString()}원</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{parseInt(item.subtotal).toLocaleString()}원</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {selectedQuote.quote.notes && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                                <strong>요청 사항:</strong>
                                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedQuote.quote.notes}</p>
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyPage
