
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../../components/Navbar'

function AdminNotifications({ user }) {
    const [notifications, setNotifications] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingNotice, setEditingNotice] = useState(null)
    const [formData, setFormData] = useState({ title: '', content: '', is_active: true })

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/notifications', { credentials: 'include' })
            const data = await res.json()
            setNotifications(data)
        } catch (error) {
            console.error('Fetch notifications error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const baseUrl = import.meta.env.VITE_API_URL || ''
        const url = editingNotice ? `${baseUrl}/api/notifications/${editingNotice.id}` : `${baseUrl}/api/notifications`
        const method = editingNotice ? 'PUT' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                alert(editingNotice ? '공지사항이 수정되었습니다' : '공지사항이 등록되었습니다')
                setShowModal(false)
                setEditingNotice(null)
                setFormData({ title: '', content: '', is_active: true })
                fetchNotifications()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('저장 실패')
            }
        } catch (error) {
            console.error('Submit error:', error)
            alert('오류가 발생했습니다')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (res.ok) {
                fetchNotifications()
            } else {
                if (res.status === 401) {
                    alert('세션이 만료되었습니다. 다시 로그인해주세요.')
                    window.location.href = '/login'
                    return
                }
                alert('삭제 실패')
            }
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const openEditModal = (notice) => {
        setEditingNotice(notice)
        setFormData({
            title: notice.title,
            content: notice.content,
            is_active: notice.is_active
        })
        setShowModal(true)
    }

    const openAddModal = () => {
        setEditingNotice(null)
        setFormData({ title: '', content: '', is_active: true })
        setShowModal(true)
    }

    return (
        <div className="dashboard">
            <Navbar user={user} isAdminMode={true} />

            <div className="dashboard-content container" style={{ maxWidth: '1200px' }}>
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>공지사항 관리</h1>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + 공지사항 등록
                    </button>
                </div>

                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>No.</th>
                                <th>제목</th>
                                <th>내용</th>
                                <th>상태</th>
                                <th>등록일</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map(notice => (
                                <tr key={notice.id}>
                                    <td style={{ textAlign: 'center' }}>{notice.id}</td>
                                    <td style={{ fontWeight: 'bold' }}>{notice.title}</td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {notice.content}
                                    </td>
                                    <td>
                                        <span className={`badge ${notice.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                            {notice.is_active ? '게시중' : '숨김'}
                                        </span>
                                    </td>
                                    <td>{new Date(notice.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={() => openEditModal(notice)} className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                            수정
                                        </button>
                                        <button onClick={() => handleDelete(notice.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#dc3545', border: 'none', color: 'white', borderRadius: '4px' }}>
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px'
                    }}>
                        <h2>{editingNotice ? '공지사항 수정' : '공지사항 등록'}</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>제목</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>내용</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    rows="5"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        style={{ width: 'auto', margin: 0 }}
                                    />
                                    <span>게시 여부</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>저장</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, background: '#6c757d' }}>취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminNotifications
