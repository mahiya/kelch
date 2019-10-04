const fs = require('fs-extra');
const path = require('path');
const common = require('./common');

const AWS = require('aws-sdk');
AWS.config.region = common.getRegion();

module.exports = class KelchDeploy {

    constructor() {

    }

    async deploy(stackName, bucketName) {
        const workingDirPath = path.join(__dirname, '.tmp');
        try {
            await this.createWorkingDirectory(workingDirPath);
            await this.createBucketIfNotExists(bucketName);
            var result = await this.createTeamplte(workingDirPath, '.');
            await this.deploy(result.templateFilePath, stackName, bucketName);
            await this.displayEndpoint(stackName, result.apiPaths);
        } catch (e) {
            console.error(e);
        } finally {
            await this.deleteWorkingDirectory(workingDirPath);
        }
    }

    async createTeamplte(workingDirPath, userCodesPath) {

        console.log('Creating upload artifacts and AWS CloudFormation template file');

        // Read template file of AWS CloudFormation template
        var template = await fs.readJSON(path.join(__dirname, 'base-template.json'));

        // Read the code that will be attached with user's codes
        var handlerCode = await fs.readFile(path.join(__dirname, 'handler.js'), { encoding: 'utf-8' });

        // Get JavaScript file names
        var fileNames = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');

        // メソッドの出力変数
        var result = {
            templateFilePath: '',
            apiPaths: []
        };

        // 各JavaScriptファイルごとに処理をする
        for (var i = 0; i < fileNames.length; i++) {
            var fileName = fileNames[i];

            // リソース名を取得する
            var resourceName = path.basename(fileName, path.extname(fileName));

            // 各JSファイルごとにフォルダを作成する
            var codeDirName = resourceName;
            var functionDirPath = path.join(workingDirPath, codeDirName);
            await fs.mkdir(functionDirPath);

            // 対象のJSファイルのコードを読み込む
            var userCode = await fs.readFile(path.join(userCodesPath, fileName), { encoding: 'utf-8' });

            // HandlerコードとマージしたJSファイルを作成する
            await fs.writeFile(path.join(functionDirPath, fileName), userCode + "\n" + handlerCode);

            // node_modulesフォルダをコピーする
            var nodeModulesPath = path.join(userCodesPath, 'node_modules');
            if (await fs.exists(nodeModulesPath)) {
                await fs.copy(nodeModulesPath, path.join(functionDirPath, 'node_modules'));
            }

            // 関数の設定を定義する
            var properties = {
                "timeout": this.getFunctionParameter(fileName, 'timeout', 3),
                "memorySize": this.getFunctionParameter(fileName, 'memorySize', 128),
                "runtime": this.getFunctionParameter(fileName, 'runtime', 'nodejs8.10'),
            };

            // ResourcesにLambda Function リソースを追加する
            var logicalName = resourceName.match(/[0-9a-zA-Z]+/g).join("");
            var apiPath = '/' + resourceName;
            result.apiPaths.push(apiPath);
            template['Resources'][logicalName] = {
                Type: 'AWS::Serverless::Function',
                Properties: {
                    CodeUri: codeDirName,
                    Handler: resourceName + ".handler",
                    Timeout: properties.timeout,
                    MemorySize: properties.memorySize,
                    Runtime: properties.runtime,
                    //Enviroment: properties.enviroment,
                    //Tags: properties.tags,
                    //ReservedConcurrentExecutions: properties.concurrentExecutions
                    Events: {
                        ApiCall: {
                            Type: 'Api',
                            Properties: {
                                Path: apiPath,
                                Method: 'ANY',
                                RestApiId: {
                                    Ref: "KelchAPIGateway"
                                }
                            }
                        }
                    }
                }
            };
        }

        // 生成した AWS CloudFormation テンプレートをファイルとして出力する
        result.templateFilePath = path.join(workingDirPath, 'template.json');
        await fs.writeFile(result.templateFilePath, JSON.stringify(template));

        return result;
    }

    // 設定ファイル(kelch-config.json)での設定値を取得する
    getFunctionParameter(functionName, parameterName, defaultValue) {
        var config = common.getConfig();
        if (config['functions'] != null
            && config['functions'][functionName] != null
            && config['functions'][functionName][parameterName] != null) {
            return config['functions'][functionName][parameterName];
        } else if (config['default'] != null
            && config['default'][parameterName] != null) {
            return config['default'][parameterName];
        } else {
            return defaultValue;
        }
    }

    // AWS CloudFormation スタックをデプロイする
    async deploy(templateFilePath, stackName, bucketName) {
        await common.exec('aws cloudformation package --template-file ' + templateFilePath + ' --output-template-file ' + templateFilePath + ' --s3-bucket ' + bucketName + ' --use-json');
        await common.exec('aws cloudformation deploy --template-file ' + templateFilePath + ' --stack-name ' + stackName + ' --capabilities CAPABILITY_IAM');
    }

    // 生成した API Gateway のエンドポイントを表示する
    async displayEndpoint(stackName, apiPaths) {
        var outputs = await this.getStackOutput(stackName);
        var endpoint = outputs['KelchAPIGatewayOutput'];
        if (!endpoint) return;
        console.log('REST APIs URL:');
        apiPaths.forEach(apiPath => console.log(endpoint + apiPath.replace('/', '')));
        console.log('');
    }

    // 指定したAWS CloudFormation Stack の Outputs の値を返す
    async getStackOutput(stackName) {
        var stack = await this.getStackInfo(stackName);
        var outputs = {};
        stack['Outputs'].forEach(output => {
            outputs[output.OutputKey] = output.OutputValue;
        })
        return outputs;
    }

    // 指定したAWS CloudFormation Stack 情報を返す
    async getStackInfo(stackName) {
        var client = new AWS.CloudFormation();
        var stacks = await client.describeStacks({ StackName: stackName }).promise();
        return stacks['Stacks'][0];
    }

    // 作業用一時フォルダを作成する
    async createWorkingDirectory(path) {
        await fs.remove(path);
        await fs.mkdir(path);
    }

    // 作業用一時フォルダを削除する
    async deleteWorkingDirectory(path) {
        await fs.remove(path);
    }

    // 指定したS3バケットが存在しない場合は作成する
    async createBucketIfNotExists(bucketName) {
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

}