import React from 'react'
import guideIllustration from '../assets/guide_illustration.png' // Ensure this path is correct relative to this file? No, assets is in src/assets. 
// If this file is in src/components, then ../assets is correct.

const ProposalGuide = ({ show, onClose }) => {
    if (!show) return null

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                width: '90%',
                maxWidth: '600px',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#999',
                        padding: '5px'
                    }}
                >
                    &times;
                </button>
                <h3 style={{ marginTop: 0, marginBottom: '2rem', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.6rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>💡</span> 제안서 다운로드 기능 사용법
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0 1rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', fontSize: '1rem', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'center' }}>STEP 1</div>
                        <p style={{ margin: 0, lineHeight: '1.6', fontSize: '1.1rem', color: '#444', flex: 1 }}>
                            상품 카드의 <span style={{ color: '#e91e63', fontWeight: 'bold', fontSize: '1.2rem' }}>♥</span> 버튼을 클릭하여<br />
                            제안서 목록에 상품을 담으세요.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', fontSize: '1rem', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'center' }}>STEP 2</div>
                        <p style={{ margin: 0, lineHeight: '1.6', fontSize: '1.1rem', color: '#444', flex: 1 }}>
                            우측 하단의 <span style={{ background: '#28a745', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.95em', fontWeight: 'bold' }}>📋 제안서 다운로드</span><br />
                            버튼을 확인하세요.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold', padding: '6px 12px', borderRadius: '6px', fontSize: '1rem', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'center' }}>STEP 3</div>
                        <p style={{ margin: 0, lineHeight: '1.6', fontSize: '1.1rem', color: '#444', flex: 1 }}>
                            버튼을 클릭하여 목록을 확인하고<br />
                            <span style={{ fontWeight: 'bold', color: '#28a745' }}>엑셀 파일(.xlsx)</span>로 다운로드하세요.
                        </p>
                    </div>
                </div>

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '10px 30px',
                            borderRadius: '25px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0,123,255,0.2)'
                        }}
                    >
                        확인했습니다
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProposalGuide
