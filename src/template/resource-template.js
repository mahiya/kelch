/**
 *  req = {
 *      body: object,
 *      pathParameters: [ string, ... ],
 *      queryStringParameters: [ string, ... ],
 *  }
 */

// You can define functions corresponding to each HTTP method
function get(req) {
    // By returning value as it is, Kelch will return Http status code 200 and body containing returned value
    return 'Hello Kelch !!';
}

function post(req) {
    // You can get body, query string values, path parameters etc. from req passed by Kelch
    var body = req.body;
}

function put(req) {
    // You can set HTTP status code you want to return
    return { statusCode: 204 };
}

// You don't need to prepare all HTTP method functions
// function del(req) {
// }
