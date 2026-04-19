import { deleteProfileDataById } from "../models/deleteProfileData.js"

export async function handleDeleteProfilesById(req, res) {

    try {

        const id = req.params.id

        if (id) {

            const message = await deleteProfileDataById(id)

            if (message === 'Delete successful') {
        
                res.status(204).end()
        
            } else if (message === 'Data does not exist') {

                res.status(404).json({status: 'error', message: `Profile data with id: ${id} does not exist`})
            }
            else {
        
                res.status(500).json({status: 'error', message: 'Delete was unsuccessful. Please try again'})
            }

        } else {

            res.status(400).json({status: 'error', message: 'Include a query id in your request'})
        }
    
    } catch(err) {

        console.log(err)
        res.status(500).json({status: 'error', message: 'Internal Server Error'})
    }


}