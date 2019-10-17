
exports.handler = async (event) => {

    var req = {
        body: event.body,
        queryStringParameters: event.queryStringParameters,
        pathParameters: event.pathParameters
    };

    if (event.httpMethod == "GET") {
        if (typeof get != 'function') return response(405);
        var resp = isAsyncFunction(get) ? await get(req) : get(req);
        return response(200, resp);
    } else if (event.httpMethod == "POST") {
        if (typeof post != 'function') return response(405);
        var resp = isAsyncFunction(post) ? await post(req) : post(req);
        return response(200, resp);
    } else if (event.httpMethod == "PUT") {
        if (typeof put != 'function') return response(405);
        var resp = isAsyncFunction(put) ? await put(req) : put(req);
        return response(200, resp);
    } else if (event.httpMethod == "DELETE") {
        if (typeof del != 'function') return response(405);
        var resp = isAsyncFunction(del) ? await del(req) : del(req);
        return response(200, resp);
    } else if (event.httpMethod == "HEAD") {
        if (typeof head != 'function') return response(405);
        var resp = isAsyncFunction(head) ? await head(req) : head(req);
        return response(200, resp);
    } else if (event.httpMethod == "PATCH") {
        if (typeof patch != 'function') return response(405);
        var resp = isAsyncFunction(patch) ? await patch(req) : patch(req);
        return response(200, resp);
    } else {
        return response(405);
    }

    function isAsyncFunction(func) {
        return func.constructor.name == "AsyncFunction";
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
