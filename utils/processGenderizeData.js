import { sendResponse } from "./sendResponse.js"

export function processGenderizeData(res, dataObj) {

    try {

        if (dataObj.gender && dataObj.count) {

            // Rename count to sample_size
            dataObj.sample_size = dataObj.count
            delete dataObj.count

            
            // Compute is_confident: true when probability >= 0.7 AND sample_size >= 100
            dataObj.is_confident = dataObj.probability >= 0.7 && dataObj.sample_size >= 100 ? true : false


            // Generate processed_at on every request. UTC, ISO 8601
            const now = new Date()
            dataObj.processed_at = now.toISOString()
            
            return dataObj
        } else {

            sendResponse(res, 502, 'application/json', { "status": "error", "message": "No prediction available for the provided name" })
            return
        }
        

    } catch(err) {
        throw new Error(`Was unable to process data: ${err}`)
    }

}