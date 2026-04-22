import cors from 'cors'
import express from "express"
import { classifyRouter } from './routes/classifyRouter.js'
import { profilesRouter } from './routes/profilesRouter.js'
import { createTable } from './db/createTable.js'

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json())

app.use('/api/classify', classifyRouter)

app.use('/api/profiles', profilesRouter)

app.use((req, res) => {
    res.status(404).json({
            error: 'Invalid endpoint',
            message: 'Endpoint is invalid. Check the API documentation for more information'
        })
})

async function startServer() {
    try {
        await createTable()
        app.listen(PORT, '0.0.0.0', () => console.log(`This server is listening on port: ${PORT}`))
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()