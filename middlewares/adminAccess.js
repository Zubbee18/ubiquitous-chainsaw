export async function checkAdminAccess(req, res, next) {

    const adminAccess = req.user.user.role

    if (adminAccess === 'admin') {
        next()
    }

    return res.status(403).json({status: 'error', message: 'Requires admin access'})
}