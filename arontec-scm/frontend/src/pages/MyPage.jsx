import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

    const handleDownloadPDF = async () => {
        const input = document.getElementById('quote-detail-content')
        if (!input) return

        try {
            const canvas = await html2canvas(input, { scale: 2 })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`quote_${selectedQuote.quote.quote_number}.pdf`)
        } catch (error) {
            console.error('PDF generation error:', error)
            alert('PDF 다운로드 중 오류가 발생했습니다.')
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
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={handleDownloadPDF} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                    PDF 다운로드
                                </button>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                        </div>

                        <div id="quote-detail-content" style={{ padding: '1rem', background: 'white' }}>
                            <div style={{ marginBottom: '2rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
                                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>견 적 서</h1>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <p><strong>견적번호:</strong> {selectedQuote.quote.quote_number}</p>
                                        <p><strong>요청일:</strong> {new Date(selectedQuote.quote.created_at).toLocaleDateString()}</p>
                                        <p><strong>납기일:</strong> {selectedQuote.quote.delivery_date ? new Date(selectedQuote.quote.delivery_date).toLocaleDateString() : '-'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p><strong>상태:</strong> {selectedQuote.quote.status === 'pending' ? '대기중' : selectedQuote.quote.status === 'approved' ? '승인' : '거절'}</p>
                                        <p><strong>총 금액:</strong> <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{parseInt(selectedQuote.quote.total_amount).toLocaleString()}원</span></p>
                                    </div>
                                </div>
                            </div>

                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>브랜드</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>모델명</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>단가</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>수량</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>합계</th>
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

                            <div style={{ marginTop: '3rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                                <p>본 견적서는 아론텍코리아 SCM 시스템에서 발급되었습니다.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyPage
