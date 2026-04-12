import http from "node:http"
import { sendResponse } from "./utils/sendResponse.js"
import { handleGenderize } from "./utils/handleGenderize.js"

const PORT = process.env.PORT || 3000

const server = http.createServer( async (req, res) => {

    if (req.url === '/') {
        // res.writeHead(302, { 'Location': '/api/classify' })
        // res.end()
        sendResponse(res, 404, 'application/json', {
            error: 'Invalid endpoint',
            message: 'Endpoint is invalid, use /api/classify?name=query'
        })
    } 
    
    if (req.url.startsWith('/api/classify?name') && req.method === 'GET') {

        // extract the name query
        const nameQuery = req.url.split('=')[1]
        // Validate: name must contain only alphabetic characters
        if (!nameQuery || !/^[a-zA-Z]+$/.test(nameQuery)) {
            sendResponse(res, 422, 'application/json', {
                status: "error",
                message: "Invalid 'name' parameter. Name must contain only alphabetic characters"
            })
            return
        }

        const processedData = await handleGenderize(res, nameQuery)

        console.log(processedData)

        // sendResponse(res, 200, 'application/json', content)
        sendResponse(res, 200, 'application/json', processedData)   
        return
    }

    if (req.url === '/api/classify' && req.method === 'GET') {
        sendResponse(res, 400, 'application/json', {status: "error", message: "Missing 'name' parameter. Please add a name query to your API call"})
        return
    }

})

server.listen(PORT, () => console.log(`This server is listening on port: ${PORT}`))