import express from 'express'
import { handleGenderize } from '../controllers/classifyController.js'

export const classifyRouter = express.Router()

// for the stage 0 classify endpoint
classifyRouter.get('/classify', handleGenderize)