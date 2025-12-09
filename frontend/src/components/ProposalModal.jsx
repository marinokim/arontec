import React from 'react'
import { useNavigate } from 'react-router-dom'

const ProposalModal = ({ show, onClose, items, onRemove, onClear, onDownload }) => {
    const navigate = useNavigate()

    if (!show) return null

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content" style={{
                background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '800px',
                maxHeight: '80vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>제안서 목록 ({items.length})</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                {items.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>제안서 목록에 담긴 상품이 없습니다.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {items.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', border: '1px solid #eee', padding: '1rem', borderRadius: '8px', alignItems: 'center' }}>
                                <div
                                    onClick={() => {
                                        onClose()
                                        navigate(`/product/${item.id}`, { state: { from: 'proposal' } })
                                    }}
                                    style={{ display: 'flex', gap: '1rem', flex: 1, cursor: 'pointer', alignItems: 'center' }}
                                >
                                    <img src={item.image_url} alt={item.model_name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>{item.brand}</div>
                                        <div style={{ fontWeight: 'bold' }}>{item.model_name}</div>
                                        <div style={{ color: '#007bff' }}>{parseInt(item.b2b_price).toLocaleString()}원</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={onClear}
                        className="btn btn-secondary"
                        style={{ background: '#dc3545' }}
                    >
                        전체 삭제
                    </button>
                    <button
                        onClick={onDownload}
                        className="btn btn-primary"
                        style={{ background: '#28a745' }}
                    >
                        엑셀 다운로드 (.xlsx)
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProposalModal
