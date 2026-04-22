import express from 'express'
import { handlePostProfiles,
        handleGetProfilesById,
        handleDeleteProfilesById, 
        handleGetProfilesByQueryParams, 
        handleGetProfilesBySearchQueryParams } from '../controllers/profilesController.js'

export const profilesRouter = express.Router()

// for the post endpoint of /api/profiles
profilesRouter.post('/', handlePostProfiles)

// for get endpoint of api/profiles/{id}
profilesRouter.get('/:id', handleGetProfilesById) // come back to id later

// for get endpoing of api/profiles
profilesRouter.get('/', handleGetProfilesByQueryParams)

profilesRouter.get('/search', handleGetProfilesBySearchQueryParams)

profilesRouter.delete('/:id', handleDeleteProfilesById)