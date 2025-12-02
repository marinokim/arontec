// Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: '로그인이 필요합니다' })
    }
    next()
}

// Middleware to check if user is approved
export const requireApproved = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    if (!req.session.isApproved) {
        return res.status(403).json({ error: '관리자 승인 대기중입니다' })
    }

    next()
}

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    if (!req.session.isAdmin) {
        return res.status(403).json({ error: '관리자 권한이 필요합니다' })
    }

    next()
}
