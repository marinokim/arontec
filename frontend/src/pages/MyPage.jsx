import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { downloadProposalFromHistory } from '../utils/proposalUtils'

import Navbar from '../components/Navbar'

function MyPage({ user }) {
    const [selectedQuote, setSelectedQuote] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [quotes, setQuotes] = useState([])
    const [proposalHistory, setProposalHistory] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        fetchQuotes()
        fetchProposalHistory()
    }, [])

    const fetchQuotes = async () => {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/quotes', { credentials: 'include' })
        const data = await res.json()
        setQuotes(data.quotes)
    }

    const fetchProposalHistory = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/proposals/my', { credentials: 'include' })
            const data = await res.json()
            if (data.history) {
                setProposalHistory(data.history)
            }
        } catch (error) {
            console.error('Error fetching proposal history:', error)
        }
    }

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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        companyName: '',
        contactPerson: '',
        phone: '',
        email: '',
        businessNumber: '',
        password: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (user) {
            setEditForm(prev => ({
                ...prev,
                companyName: user.companyName || '',
                contactPerson: user.contactPerson || '',
                phone: user.phone || '',
                email: user.email || '',
                businessNumber: user.businessNumber || ''
            }))
        }
    }, [user])

    const formatBusinessNumber = (value) => {
        const numbers = value.replace(/[^0-9]/g, '')
        if (numbers.length <= 3) return numbers
        if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다')
            return
        }

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    companyName: editForm.companyName,
                    contactPerson: editForm.contactPerson,
                    phone: editForm.phone,
                    email: editForm.email,
                    businessNumber: editForm.businessNumber,
                    password: editForm.password || undefined
                })
            })

            if (res.ok) {
                alert('회원정보가 수정되었습니다. 변경된 내용을 반영하기 위해 새로고침합니다.')
                window.location.reload()
            } else {
                const data = await res.json()
                alert(data.error || '회원정보 수정에 실패했습니다')
            }
        } catch (error) {
            console.error('Edit profile error:', error)
            alert('회원정보 수정 중 오류가 발생했습니다')
        }
    }

    return (
        <div className="catalog-page">
            <Navbar user={user} />
            <div className="catalog-header">
                <h1>내 정보</h1>
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← 대시보드</button>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>회사 정보</h2>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        정보 수정
                    </button>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <p><strong>이메일:</strong> {user?.email}</p>
                    <p><strong>사업자번호:</strong> {user?.businessNumber}</p>
                    <p><strong>회사명:</strong> {user?.companyName}</p>
                    <p><strong>담당자:</strong> {user?.contactPerson}</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2>제안서 다운로드 이력</h2>
                {proposalHistory.length === 0 ? (
                    <p className="text-muted">다운로드 이력이 없습니다</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>파일명</th>
                                <th>상품수</th>
                                <th>다운로드 일시</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposalHistory.map(history => (
                                <tr key={history.id}>
                                    <td>{history.title}</td>
                                    <td>{history.items?.length || 0}개</td>
                                    <td>{new Date(history.created_at).toLocaleString()}</td>
                                    <td>
                                        <button
                                            onClick={() => downloadProposalFromHistory(history, user)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                        >
                                            다시 받기
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
                                            {quote.status === 'pending' ? '대기중' : quote.status === 'approved' ? '승인' : quote.status === 'shipped' ? '배송중' : '거절'}
                                        </span>
                                        {quote.status === 'shipped' && (
                                            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#666' }}>
                                                {quote.carrier}<br />
                                                {quote.tracking_number}
                                            </div>
                                        )}
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

            {isEditModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>회원정보 수정</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>회사명</label>
                                <input
                                    type="text"
                                    value={editForm.companyName}
                                    onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                                    required
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>담당자명</label>
                                <input
                                    type="text"
                                    value={editForm.contactPerson}
                                    onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })}
                                    required
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>전화번호</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>이메일</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    required
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>사업자번호</label>
                                <input
                                    type="text"
                                    value={editForm.businessNumber}
                                    onChange={e => setEditForm({ ...editForm, businessNumber: formatBusinessNumber(e.target.value) })}
                                    required
                                    className="form-control"
                                    placeholder="000-00-00000"
                                    maxLength="12"
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                                <label>새 비밀번호 (변경시에만 입력)</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                    className="form-control"
                                    placeholder="변경하지 않으려면 비워두세요"
                                    autoComplete="new-password"
                                    style={{ imeMode: 'disabled' }}
                                />
                            </div>
                            {editForm.password && (
                                <div className="form-group">
                                    <label>새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        value={editForm.confirmPassword}
                                        onChange={e => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                        className="form-control"
                                        autoComplete="new-password"
                                        style={{ imeMode: 'disabled' }}
                                    />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">취소</button>
                                <button type="submit" className="btn btn-primary">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

                        <div id="quote-detail-content" style={{ padding: '2rem', background: 'white', minHeight: '1000px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '2rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
                                <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}>견 적 서</h1>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                                    {/* Left: Supplier Info */}
                                    <div style={{ flex: 1, border: '1px solid #ddd', padding: '1.5rem', borderRadius: '4px', background: '#f9f9f9' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>공급받는 자</h4>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ padding: '6px 0', width: '70px', color: '#555', fontWeight: 'bold' }}>회사명</td>
                                                    <td>: {user?.companyName}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '6px 0', color: '#555', fontWeight: 'bold' }}>담당자</td>
                                                    <td>: {user?.contactPerson}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '6px 0', color: '#555', fontWeight: 'bold' }}>이메일</td>
                                                    <td>: {user?.email}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Right: Quote Info & Status */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                        <table style={{ borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'right' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ padding: '4px 0', width: '80px', color: '#666' }}>견적번호</td>
                                                    <td>: {selectedQuote.quote.quote_number}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', color: '#666' }}>요청일자</td>
                                                    <td>: {new Date(selectedQuote.quote.created_at).toLocaleDateString()}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '4px 0', color: '#666' }}>납기일자</td>
                                                    <td>: {selectedQuote.quote.delivery_date ? new Date(selectedQuote.quote.delivery_date).toLocaleDateString() : '-'}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginRight: '0.5rem' }}>상태:</span>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.4rem 1.2rem',
                                                    borderRadius: '4px',
                                                    background: selectedQuote.quote.status === 'approved' ? '#e6f4ea' : selectedQuote.quote.status === 'shipped' ? '#e3f2fd' : '#fff3e0',
                                                    color: selectedQuote.quote.status === 'approved' ? '#1e7e34' : selectedQuote.quote.status === 'shipped' ? '#0d47a1' : '#e65100',
                                                    fontWeight: 'bold',
                                                    border: `1px solid ${selectedQuote.quote.status === 'approved' ? '#1e7e34' : selectedQuote.quote.status === 'shipped' ? '#0d47a1' : '#e65100'}`
                                                }}>
                                                    {selectedQuote.quote.status === 'pending' ? '승인 대기중' : selectedQuote.quote.status === 'approved' ? '승인 완료' : selectedQuote.quote.status === 'shipped' ? '배송중' : '반려됨'}
                                                </span>
                                            </div>
                                            {selectedQuote.quote.status === 'shipped' && (
                                                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#007bff' }}>
                                                    <strong>배송정보:</strong> {selectedQuote.quote.carrier} {selectedQuote.quote.tracking_number}
                                                </div>
                                            )}
                                            <div>
                                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', marginRight: '1rem' }}>총 금액:</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#333' }}>{parseInt(selectedQuote.quote.total_amount).toLocaleString()}</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#333', marginLeft: '0.5rem' }}>원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                <colgroup>
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '40%' }} />
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '20%' }} />
                                </colgroup>
                                <thead>
                                    <tr style={{ background: '#f1f3f5', borderTop: '2px solid #333', borderBottom: '1px solid #dee2e6' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>브랜드</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>모델명</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>단가</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>수량</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>합계</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedQuote.items.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{item.brand}</td>
                                            <td style={{ padding: '10px' }}>{item.model_name}</td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>{parseInt(item.unit_price).toLocaleString()}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>{parseInt(item.subtotal).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: '#f8f9fa', borderTop: '2px solid #333' }}>
                                        <td colSpan="4" style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>합 계 (VAT포함)</td>
                                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {parseInt(selectedQuote.quote.total_amount).toLocaleString()}원
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {selectedQuote.quote.notes && (
                                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                                    <strong>요청 사항:</strong>
                                    <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedQuote.quote.notes}</p>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', textAlign: 'center', color: '#666', fontSize: '0.9rem', paddingTop: '3rem' }}>
                                <p style={{ marginBottom: '1rem' }}>본 견적서는 아론텍코리아 SCM 시스템에서 발급되었습니다.</p>
                                <h2 style={{ color: '#0056b3', letterSpacing: '2px' }}>ARONTEC KOREA</h2>
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
