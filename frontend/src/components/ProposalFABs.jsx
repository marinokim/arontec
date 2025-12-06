import React from 'react'

const ProposalFABs = ({ itemCount, onOpenProposal, onOpenGuide }) => {
    return (
        <>
            {/* Proposal Floating Button */}
            <div
                className="proposal-fab"
                onClick={onOpenProposal}
                style={{
                    position: 'fixed',
                    bottom: '5rem', // Moved up to make room for guide button
                    right: '2rem',
                    background: '#28a745',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '50px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 100
                }}
            >
                <span>📋 제안서 다운로드</span>
                <span style={{ background: 'white', color: '#28a745', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {itemCount}
                </span>
            </div>

            {/* Reopen Guide Button */}
            <div
                className="guide-fab"
                onClick={onOpenGuide}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: '#6c757d',
                    color: 'white',
                    padding: '0.8rem 1.2rem',
                    borderRadius: '50px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 100,
                    fontSize: '0.9rem'
                }}
            >
                <span>❓ 안내가이드</span>
            </div>
        </>
    )
}

export default ProposalFABs
