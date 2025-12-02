import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Catalog from './pages/Catalog'
import Cart from './pages/Cart'
import QuoteRequest from './pages/QuoteRequest'
import MyPage from './pages/MyPage'
import AdminDashboard from './pages/admin/Dashboard'
import AdminMembers from './pages/admin/Members'
import AdminProducts from './pages/admin/Products'
import AdminQuotes from './pages/admin/Quotes'
import AdminNotifications from './pages/admin/Notifications'
import ProductDetail from './pages/ProductDetail'

// Assuming ProtectedRoute is defined elsewhere or will be added.
// For now, let's define a placeholder ProtectedRoute that mimics the original logic
// to ensure the code remains syntactically correct and functional based on the user's intent
// to introduce this component. If ProtectedRoute is not provided, this will cause a runtime error.
// However, the instruction is to apply the change as given, which includes this component.
const ProtectedRoute = ({ children, requireAdmin, user }) => {
    if (!user) {
        return <Navigate to="/login" />;
    }
    if (requireAdmin && !user.isAdmin) {
        return <Navigate to="/dashboard" />;
    }
    return children;
};


function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = async () => {
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/me', { credentials: 'include' })
                if (res.ok) {
                    const data = await res.json()
                    setUser(data.user)
                }
            } catch (error) {
                console.error('Auth check failed:', error)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    if (loading) {
        return <div className="loading">로딩중...</div>
    }

    return (
        <Router>
            <div className="app">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
                    <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

                    {/* Protected Routes - B2B Partner */}
                    <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
                    <Route path="/catalog" element={user ? <Catalog user={user} /> : <Navigate to="/login" />} />
                    <Route path="/product/:id" element={user ? <ProductDetail user={user} /> : <Navigate to="/login" />} />
                    <Route path="/cart" element={user ? <Cart user={user} /> : <Navigate to="/login" />} />
                    <Route path="/quote-request" element={user ? <QuoteRequest user={user} /> : <Navigate to="/login" />} />
                    <Route path="/mypage" element={user ? <MyPage user={user} /> : <Navigate to="/login" />} />

                    {/* Protected Routes - Admin Only */}
                    <Route path="/admin" element={user?.isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
                    <Route path="/admin/members" element={<ProtectedRoute requireAdmin user={user}><AdminMembers /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute requireAdmin user={user}><AdminProducts /></ProtectedRoute>} />
                    <Route path="/admin/quotes" element={<ProtectedRoute requireAdmin user={user}><AdminQuotes /></ProtectedRoute>} />
                    <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin user={user}><AdminNotifications /></ProtectedRoute>} />

                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
