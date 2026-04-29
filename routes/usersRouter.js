import express from 'express'

export const usersRouter = express.Router()

// GET /api/users/me - Get current authenticated user information
usersRouter.get('/me', (req, res) => {
    // req.user is attached by the authenticateUser middleware
    if (!req.user) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'User not authenticated' 
        })
    }

    // Return user information
    return res.status(200).json({
        status: 'success',
        data: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            avatar_url: req.user.avatar_url,
            is_active: req.user.is_active,
            last_login_at: req.user.last_login_at
        }
    })
})