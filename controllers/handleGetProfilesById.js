import { retrieveProfileDataById } from '../models/retrieveProfileData.js'

export async function handleGetProfilesById(req, res) {

    try {

        const id = req.params.id
    
        const profile = await retrieveProfileDataById(id)
    
        if (profile) {
    
            res.status(200).json({status: 'success', data: profile})
    
        } else {
    
            res.status(404).json({status: 'error', message: 'Profile not found'})
        }

    } catch(err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }


}