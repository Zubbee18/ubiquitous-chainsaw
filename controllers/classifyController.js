export async function getGenderizeData(url) {

    try {
        
        // fetching the response object
        const response = await fetch(url)

        // only moving forward if the response came out positive
        if (!response.ok) {
            throw new Error('Fetch was successful but there is an issue. Status code: ' + response.status)
        }

        // convert the response to json object
        return await response.json()

    } catch(err) {
        
        console.error("Could not fetch data:", err)
        throw err
    }

}

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

            res.status(502).json({ "status": "error", "message": "No prediction available for the provided name" })
            return
        }
        

    } catch(err) {
        throw new Error(`Was unable to process data: ${err}`)
    }

}

export async function handleGenderize(req, res)  {

    const { name } = req.query

    if (name) {

        if (/^[0-9]+$/.test(name)) { // supposed to check for nonsensical names but for now I can only check for names without numbers
            res.status(422).json({
                status: "error",
                message: "Invalid 'name' parameter. Name must contain only alphabetic characters"
            })
            return
        }

        try {

            const genderizeData = await getGenderizeData(`https://api.genderize.io?name=${name}`)
            
            const processedData = processGenderizeData(res, genderizeData)

            res.json({status: "success", data: processedData})

        } catch(err) {

            throw new Error(`Was unable to get or process data: ${err}`)
        }

    } else {

        res.status(400).json({status: "error", message: "Missing 'name' parameter. Please add a name query to your API call"})
    }

}