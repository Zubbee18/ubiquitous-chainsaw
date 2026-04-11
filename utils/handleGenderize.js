import { getGenderizeData } from "./getGenderizeData.js"
import { processGenderizeData } from "./processGenderizeData.js"

export async function handleGenderize(res, nameQuery) {

    // send a message to the url with the name query
    const content = await getGenderizeData(`https://api.genderize.io?name=${nameQuery}`)

    // do the processing
    const processedData = processGenderizeData(res, content)

    return processedData
}

