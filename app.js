import cors from 'cors'
import express from "express"
import { classifyRouter } from './Routes/appRouter.js'

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors())

app.use('/api', classifyRouter)

app.use((req, res) => {
    res.status(404).json({
            error: 'Invalid endpoint',
            message: 'Endpoint is invalid, use /api/classify?name=query'
        })
})


app.listen(PORT, () => console.log(`This server is listening on port: ${PORT}`))