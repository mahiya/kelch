const KelchCommon = require('./common');
const AWS = require('aws-sdk');
AWS.config.region = KelchCommon.getRegion();

module.exports = class CloudFormationClient {

    // AWS CloudFormation スタックをデプロイする
    static async deployStack(templateFilePath, stackName, bucketName) {
        await this.createBucketIfNotExists(bucketName);
        await KelchCommon.exec('aws cloudformation package --template-file ' + templateFilePath + ' --output-template-file ' + templateFilePath + ' --s3-bucket ' + bucketName + ' --use-json');
        await KelchCommon.exec('aws cloudformation deploy --template-file ' + templateFilePath + ' --stack-name ' + stackName + ' --capabilities CAPABILITY_IAM');
    }

    // 指定したAWS CloudFormation スタックを削除する
    static async deleteStack(stackName) {
        await KelchCommon.exec('aws cloudformation delete-stack --stack-name ' + stackName);
    }

    // 指定したAWS CloudFormation Stack の Outputs の値を返す
    static async getStackOutput(stackName) {
        var stack = await this.getStackInfo(stackName);
        var outputs = {};
        stack['Outputs'].forEach(output => {
            outputs[output.OutputKey] = output.OutputValue;
        })
        return outputs;
    }

    // 指定したAWS CloudFormation Stack 情報を返す
    static async getStackInfo(stackName) {
        var client = new AWS.CloudFormation();
        var stacks = await client.describeStacks({ StackName: stackName }).promise();
        return stacks['Stacks'][0];
    }

    // 指定したS3バケットが存在しない場合は作成する
    static async createBucketIfNotExists(bucketName) {
        var s3 = new AWS.S3();
        try {
            await s3.headBucket({ Bucket: bucketName }).promise();
        } catch (e) {
            if (e.statusCode != 404) throw e;
            // HTTP status code が 404 の場合は存在しないので作成する
            console.log("Creating S3 bucket '%s'", bucketName);
            await s3.createBucket({ Bucket: bucketName }).promise();
        }
    }

    static async getAccountId() {
        var sts = new AWS.STS();
        var resp = await sts.getCallerIdentity({}).promise();
        return resp.Account;
    }

    static async getDefaultS3BucketName() {
        var awsAccountId = await this.getAccountId();
        var defaultBucketName = 'kelch-lambda-code-' + awsAccountId;
        return defaultBucketName;
    }

}