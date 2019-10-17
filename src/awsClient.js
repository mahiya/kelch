const KelchCommon = require('./common');
const AWS = require('aws-sdk');
AWS.config.region = KelchCommon.getRegion();

module.exports = class AWSClient {

    // Deploy the AWS CloudFormation stack
    static async deployStack(templateFilePath, stackName, bucketName) {
        await this.createBucketIfNotExists(bucketName);
        await KelchCommon.exec('aws cloudformation package --template-file ' + templateFilePath + ' --output-template-file ' + templateFilePath + ' --s3-bucket ' + bucketName + ' --use-json');
        await KelchCommon.exec('aws cloudformation deploy --template-file ' + templateFilePath + ' --stack-name ' + stackName + ' --capabilities CAPABILITY_IAM');
    }

    // Delete the CloudFormation stack
    static async deleteStack(stackName) {
        await KelchCommon.exec('aws cloudformation delete-stack --stack-name ' + stackName);
    }

    // Returns the value of Outputs of the AWS CloudFormation Stack
    static async getStackOutput(stackName) {
        var stack = await this.getStackInfo(stackName);
        var outputs = {};
        stack['Outputs'].forEach(output => {
            outputs[output.OutputKey] = output.OutputValue;
        })
        return outputs;
    }

    // Returns the AWS CloudFormation Stack information
    static async getStackInfo(stackName) {
        var client = new AWS.CloudFormation();
        var stacks = await client.describeStacks({ StackName: stackName }).promise();
        return stacks['Stacks'][0];
    }

    // Create the specified S3 bucket if it does not exist
    static async createBucketIfNotExists(bucketName) {
        var s3 = new AWS.S3();
        try {
            await s3.headBucket({ Bucket: bucketName }).promise();
        } catch (e) {
            if (e.statusCode != 404) throw e;
            // If HTTP status code is 404, S3 bucket does not exist
            console.log("Creating S3 bucket '%s'", bucketName);
            await s3.createBucket({ Bucket: bucketName }).promise();
        }
    }

    // Return the default S3 bucket name if bucket name is not provided by program arguments or config file
    static async getDefaultS3BucketName() {
        var awsAccountId = await this.getAccountId();
        var defaultBucketName = 'kelch-lambda-code-' + awsAccountId;
        return defaultBucketName;
    }

    // Returns the AWS account ID currently used by the user
    static async getAccountId() {
        var sts = new AWS.STS();
        var resp = await sts.getCallerIdentity({}).promise();
        return resp.Account;
    }

}