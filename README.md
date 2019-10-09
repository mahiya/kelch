# Kelch
Kelch enables you to build REST API incredibly easily using JavaScript and AWS Serverless Application Model. Kelch deploys your REST API codes written by JavaScript to AWS Lambda and deploys and configs AWS API Gateway.

![Kelch architecture](https://raw.githubusercontent.com/mahiya/kelch/master/doc/architecture.png "Kelch architecture")

You can use Kelch and deploy your REST API code to your AWS account by following steps.

## How to use

### Install Kelch:
```sh
$ npm install -g kelch
```

### Create REST APIs (sample.js):
```javascript
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
```

### Deploy created Rest APIs:
```sh
$ kelch deploy

REST APIs URL:
https://[api-gateway-no].execute-api.[aws-region].amazonaws.com/api/sample
```

AWS Lambda functions and AWS API Gateway will be deployed to your AWS account.  
API endpoint is defined according to file name (ex: deployed sample.js can be accessed via https://[endpoint]/api/sample)

## Command Help
```sh
Usage: kelch [OPTIONS] COMMAND [ARGS]...

Options:
    --version
    --help

Commands:
    init
        --stack-name    (optional)
        --s3-bucket     (optional)
    create-resource
        --name          (required)
    create-config
        --stack-name    (optional)
        --s3-bucket     (optional)
    deploy
        --stack-name    (optional)
        --s3-bucket     (optional)
    delete
        --stack-name    (optional)
```