
exports.handler = async (event) => {

    var req = {
        body: event.body,
        queryStringParameters: event.queryStringParameters,
        pathParameters: event.pathParameters,
        cognitoUserId: event != undefined
            && event.requestContext != undefined
            && event.requestContext.authorizer != undefined
            && event.requestContext.authorizer.claims != undefined
            ? event.requestContext.authorizer.claims["cognito:username"]
            : null,
    };

    if (event.httpMethod == "GET") {
        if (typeof get != 'function')
            return response(405);
        return response(200, await get(req));
    } else if (event.httpMethod == "POST") {
        if (typeof post != 'function')
            return response(405);
        return response(200, await post(req));
    } else if (event.httpMethod == "PUT") {
        if (typeof put != 'function')
            return response(405);
        return response(200, await put(req));
    } else if (event.httpMethod == "DELETE") {
        if (typeof del != 'function')
            return response(405);
        return response(200, await post(req));
    } else {
        return response(405);
    }

    function response(statusCode, body) {
        if (body && body.statusCode) {
            return body;
        } else {
            return {
                'statusCode': statusCode,
                'body': body == undefined ? null : JSON.stringify(body),
                'headers': { 'Access-Control-Allow-Origin': '*' },
            };
        }
    }

}
