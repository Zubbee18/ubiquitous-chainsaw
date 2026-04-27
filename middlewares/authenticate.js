import jwt from 'jsonwebtoken'
import { getUser, checkUserExists } from "../models/userData.js"

export async function authenticateUser(req, res, next) {

    const accessToken = req.cookies.access_token

    if (!accessToken) {

        return res.status(400).json({status: 'error', message: 'No access token'})
    }

    try {

        // check if the token is expired or valid - if not, error
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET)
        console.log("Token is valid:", decodedAccessToken)

        // get user id from token claims
        const id = decodedAccessToken.id

        // check if the user exists then attach the user to request and move forward
        if (await checkUserExists(id, false)) {
            console.log(id)
            req.user = await getUser(id)
            return next()
        }

        // if user does not exist send an error message
        return res.status(401).json({status: 'error', message: 'User does not exist'})

    } catch(err) {

        if (err.name === 'TokenExpiredError') {
            console.log("Access Token expired at:", err.expiredAt)
            return res.status(400).json({status: 'error', message: 'Access Token has expired'})

        }

        console.log(err.message)
        return res.status(500).json({status: 'error', message: 'Internal Server Error. Authentication Failed'})
    }
}