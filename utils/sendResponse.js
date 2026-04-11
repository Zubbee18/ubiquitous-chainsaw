export function sendResponse(res, statusCode, contentType, payload) {
    res.statusCode = statusCode
    res.setHeader('Content-Type', contentType)
    res.setHeader('Access-Control-Allow-Origin', '*')
    
    if (statusCode === 200) {
        
        res.end(JSON.stringify({status: 'success', data: payload}))
    } else {
        
        res.end(JSON.stringify(payload))
    }
}