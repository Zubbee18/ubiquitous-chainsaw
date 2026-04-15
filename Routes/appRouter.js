import express from 'express'
import { handleGenderize } from '../Controllers/handleGenderizeData.js'
import { handlePostProfiles } from '../Controllers/handlePostProfiles.js'
// import { handleGetProfilesById } from '../Controllers/handleGetProfilesById.js'
// import { handleGetProfiles } from '../Controllers/handleGetProfiles.js'

export const classifyRouter = express.Router()

// for the stage 0 classify endpoint
classifyRouter.get('/classify', handleGenderize)

// for the post endpoint of /api/profiles
classifyRouter.post('/profiles', handlePostProfiles)

// for get endpoint of api/profiles/{id}
// classifyRouter.get('/profiles/:id', handleGetProfilesById) // come back to id later

// for get endpoing of api/profiles
// classifyRouter.get('/profiles', handleGetProfiles)