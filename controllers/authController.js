import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { checkUserExists, getLoginUserFromId, createAndLoginUser } from '../models/userData.js'


export function redirectUserToGitHub(req, res) {
    
    // generate state for github
    const state = crypto.randomBytes(16).toString('hex')

    // PKCE verifier
    const verifier = generateVerifier()
    const challenge = generateChallenge(verifier)
    
    // save state and verifier in session
    req.session.state = state
    req.session.code_verifier = verifier

    // constructor parameters for github request
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        state: state,
        scope: 'user:email',
        code_challenge: challenge,
        code_challenge_method: 'S256'
    })

    // redirects the user to github with parameters
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}

export async function handleGitHubCallback(req, res) {

    const { code, state } = req.query

    if (state !== req.session.state) {
        return res.status(403).send('State mismatch. Potential CSRF attack.');
    }

    try {

        // trade code and verifier for Auth0 github tokens
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: process.env.REDIRECT_URI,
            code_verifier: req.session.code_verifier
        }, {
            headers: { Accept: 'application/json' }
        })

        const { access_token } = tokenResponse.data

        // get user information
        const githubUserInfo = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        })

        const githubUser = githubUserInfo.data
        const { login, id, avatar_url } = githubUser
        let email = githubUser.email

        if (!email) {

            const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${access_token}` }
            })

            // Find the primary email
            const primaryEmail = emailResponse.data.find(email => email.primary)
            email = primaryEmail ? primaryEmail.email : null
        }
        
        if (!email) {
            res.status(400).send({status: error, message: "No email found"})
        }
        
        let insightaUser
    
        // check if the user already exists in the user table and add if it doesn't add user
        if (await checkUserExists(id)) {
            // get the user id and attach it to the session
            insightaUser = await getLoginUserFromId(id)
    
        } else {
            // add the user to the table
            insightaUser = await createAndLoginUser(login, id, avatar_url, email)
        }
        
        // generate tokens (3m and 5m expiries)
        const accessToken = jwt.sign(
            { id: insightaUser.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '3m' }
        )

        const refreshToken = jwt.sign(
            { id: insightaUser.id }, 
            process.env.REFRESH_SECRET, 
            { expiresIn: '5m' }
        )
    
        // send to Web (HttpOnly Cookie) or CLI (JSON)
        res.cookie('access_token', accessToken, { httpOnly: true, secure: true, sameSite: 'strict' })
        .json({ accessToken, refreshToken })


    } catch(err) {
        console.log(err.message)
        res.status(500).send('Authentication failed')
    }
    
}

export async function refreshToken(req, res) {

    const { refreshToken } = req.body
    
    // Verify refresh token
    try {
        const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_SECRET)

        // check if token has already been used

        
        // Issue a new Access Token
        const newAccessToken = jwt.sign(
            { id: decodedUser.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '3m' }
        )

        // Issue a new Refresh Token
        const newRefreshToken = jwt.sign(
            { id: decodedUser.id }, 
            process.env.REFRESH_SECRET, 
            { expiresIn: '5m' }
        )

        // send to Web (HttpOnly Cookie) or CLI (JSON)
        res.cookie('access_token', newAccessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.json({ status: "success", refreshToken: newRefreshToken, accessToken: newAccessToken })

    } catch (err) {
        
        res.status(403).send("Refresh token invalid")
    }
}

export async function logoutUser(req, res) {

    const { refreshToken } = req.body


    res.clearCookie('access_token', {
        httpOnly: true,
        secure: true, // Only if you used this when setting the cookie
        sameSite: 'strict'
    })
    
    res.status(200).json({ message: 'Logged out successfully' })
}


// ======================= HELPER FUNCTIONS ====================================
// generate code-verifier
function generateVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

// generate code-challenger from verifier
function generateChallenge(verifier) {
    return crypto.createHash('sha256')
        .update(verifier)
        .digest()
        .toString('base64url');
}

