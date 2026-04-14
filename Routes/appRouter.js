import express from 'express'
import { handleGenderize } from '../Controllers/handleGenderizeData.js'

export const classifyRouter = express.Router()

classifyRouter.get('/classify', handleGenderize)