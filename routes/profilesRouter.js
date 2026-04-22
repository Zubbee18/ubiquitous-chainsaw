import express from 'express'
import { handlePostProfiles,
        handleGetProfilesById,
        handleDeleteProfilesById, 
        handleGetProfilesByQueryParams, 
        handleGetProfilesBySearchQueryParams } from '../controllers/profilesController.js'

export const profilesRouter = express.Router()

// for the post endpoint of /api/profiles
profilesRouter.post('/', handlePostProfiles)

// for get endpoint of /api/profiles for natural language query
profilesRouter.get('/search', handleGetProfilesBySearchQueryParams)

// for get endpoint of api/profiles/{id}
profilesRouter.get('/:id', handleGetProfilesById)

// for get endpoing of api/profiles
profilesRouter.get('/', handleGetProfilesByQueryParams)

profilesRouter.delete('/:id', handleDeleteProfilesById)