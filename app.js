import cors from 'cors'
import express from "express"
import { apiRouter } from './Routes/appRouter.js'

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json())

app.use('/api', apiRouter)

app.use((req, res) => {
    res.status(404).json({
            error: 'Invalid endpoint',
            message: 'Endpoint is invalid. Check the API documentation for more information'
        })
})


app.listen(PORT, () => console.log(`This server is listening on port: ${PORT}`))