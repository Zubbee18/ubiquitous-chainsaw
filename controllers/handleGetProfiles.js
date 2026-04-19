import { retrieveProfileDataByQueryParams } from '../models/retrieveProfileData.js'

export async function handleGetProfilesByQueryParams(req, res) {

    try {

        const profileData = await retrieveProfileDataByQueryParams(req.query)
    
        if (profileData.length === 0) {
    
            res.status(404).json({status: 'error', message: 'Profile not found'})
            
        } else {
            
            res.status(200).json({status: 'success', data: profileData})
        }
        
    } catch (err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }

}