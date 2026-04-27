import crypto from 'crypto'
import express from 'express'
import { redirectUserToGitHub, handleGitHubCallback, refreshToken } from '../controllers/authController.js'

export const authRouter = express.Router()

// for the auth with github endpoint
authRouter.get('/github', redirectUserToGitHub)

// github callback
authRouter.get('/github/callback', handleGitHubCallback)

authRouter.post('/refresh', refreshToken)