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