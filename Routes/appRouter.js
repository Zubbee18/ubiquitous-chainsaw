import express from 'express'
import { handleGenderize } from '../Controllers/handleGenderizeData.js'
import { handlePostProfiles } from '../Controllers/handlePostProfiles.js'
import { handleGetProfilesById } from '../Controllers/handleGetProfilesById.js'
import { handleDeleteProfilesById } from '../Controllers/handleDeleteProfilesById.js'
import { handleGetProfilesByQueryParams } from '../Controllers/handleGetProfiles.js'

export const apiRouter = express.Router()

// for the stage 0 classify endpoint
apiRouter.get('/classify', handleGenderize)

// for the post endpoint of /api/profiles
apiRouter.post('/profiles', handlePostProfiles)

// for get endpoint of api/profiles/{id}
apiRouter.get('/profiles/:id', handleGetProfilesById) // come back to id later

// for get endpoing of api/profiles
apiRouter.get('/profiles', handleGetProfilesByQueryParams)

apiRouter.delete('/profiles/:id', handleDeleteProfilesById)