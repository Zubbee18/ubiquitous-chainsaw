import 'dotenv/config'
import cors from 'cors'
import express from "express"
import { RedisStore } from 'connect-redis'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import redisClient from './db/redisClient.js'
import { createUsersTable } from './db/createTable.js'
import { authenticateUser } from './middlewares/authenticate.js'
import { checkHeaderVersion } from './middlewares/checkHeader.js'
import { classifyRouter } from './routes/classifyRouter.js'
import { profilesRouter } from './routes/profilesRouter.js'
import { createTable } from './db/createTable.js'
import { authRouter } from './routes/auth.js'

const PORT = process.env.PORT

const app = express()

app.use(cors())

app.use(
    session({
        store: new RedisStore({client: redisClient}),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
)

await createUsersTable()

// Middleware to parse JSON bodies
app.use(express.json())

app.use(cookieParser())

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
})

app.use('/auth', authRouter)

app.use('/api/classify', authenticateUser, classifyRouter)

app.use('/api/profiles', checkHeaderVersion, authenticateUser, profilesRouter)

app.use((req, res) => {
    res.status(404).json({
            error: 'Invalid endpoint',
            message: 'Endpoint is invalid. Check the API documentation for more information'
        })
})

startServer()


async function startServer() {
    try {
        await createTable()
        app.listen(PORT, '0.0.0.0', () => console.log(`This server is listening on port: ${PORT}`))

    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}