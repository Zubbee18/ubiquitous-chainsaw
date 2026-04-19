import express from 'express'
import { handleGenderize } from '../controllers/handleGenderizeData.js'

export const classifyRouter = express.Router()

// for the stage 0 classify endpoint
apiRouter.get('/classify', handleGenderize)