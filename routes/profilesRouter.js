import express from 'express'
import { handlePostProfiles } from '../controllers/handlePostProfiles.js'
import { handleGetProfilesById } from '../controllers/handleGetProfilesById.js'
import { handleDeleteProfilesById } from '../controllers/handleDeleteProfilesById.js'
import { handleGetProfilesByQueryParams } from '../controllers/handleGetProfiles.js'

export const profilesRouter = express.Router()

// for the post endpoint of /api/profiles
apiRouter.post('/profiles', handlePostProfiles)

// for get endpoint of api/profiles/{id}
apiRouter.get('/profiles/:id', handleGetProfilesById) // come back to id later

// for get endpoing of api/profiles
apiRouter.get('/profiles', handleGetProfilesByQueryParams)

apiRouter.delete('/profiles/:id', handleDeleteProfilesById)