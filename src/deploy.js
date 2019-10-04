const fs = require('fs-extra');
const path = require('path');
const common = require('./common');

const AWS = require('aws-sdk');
AWS.config.region = common.getRegion();

module.exports = class KelchDeploy {

    constructor(config, workingDirPath = path.join(__dirname, '.tmp')) {
        this.config = config;
        this.workingDirPath = workingDirPath;
    }

    async deploy(stackName, bucketName) {
        try {

            // デプロイ前に作業フォルダとFunctionコードアップロード先のS3バケットを差k末井する
            await this.createWorkingDirectory();
            await this.createBucketIfNotExists(bucketName);

            // AWS CloudFormation テンプレートを生成してファイル出力する
            const userCodesPath = '.';
            var template = await this.createTeamplte(userCodesPath);
            const templateFilePath = path.join(this.workingDirPath, 'template.json');
            await this.outputTemplateFile(template, templateFilePath)

            // AWS CloudFormation スタックをデプロイする
            await this.deployStack(templateFilePath, stackName, bucketName);
            await this.displayEndpoint(stackName, result.apiPaths);

        } catch (e) {
            console.error(e);
        } finally {
            // 作業フォルダを削除する
            await this.deleteWorkingDirectory();
        }
    }

    // 作業用一時フォルダを作成する
    async createWorkingDirectory() {
        await fs.remove(this.workingDirPath);
        await fs.mkdir(this.workingDirPath);
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

    async createTeamplte(userCodesPath) {

        console.log('Creating upload artifacts and AWS CloudFormation template file');

        // Read template file of AWS CloudFormation template
        var template = await fs.readJSON(path.join(__dirname, 'base-template.json'));

        // Read the code that will be attached with user's codes
        var handlerCode = await fs.readFile(path.join(__dirname, 'handler.js'), { encoding: 'utf-8' });

        // Get JavaScript file names
        var fileNames = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');

        // 各JavaScriptファイルごとに処理をする
        for (var i = 0; i < fileNames.length; i++) {
            var fileName = fileNames[i];

            // リソース名を取得する
            var resourceName = path.basename(fileName, path.extname(fileName));

            // 各JSファイルごとにフォルダを作成する
            var codeDirName = resourceName;
            var functionDirPath = path.join(this.workingDirPath, codeDirName);
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
            template.Resources[logicalName] = {
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
                                Path: '/' + resourceName,
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

        return template;
    }

    // 指定した AWS CloudFormation テンプレート(JSON)をファイルとして出力する
    async outputTemplateFile(template, outputPath) {
        await fs.writeFile(outputPath, JSON.stringify(template));
    }

    // 設定ファイルでのFunctionごとの設定値を取得する
    getFunctionParameter(functionName, parameterName, defaultValue) {
        if (this.config['functions'] != null
            && this.config['functions'][functionName] != null
            && this.config['functions'][functionName][parameterName] != null) {
            return this.config['functions'][functionName][parameterName];
        } else if (this.config['default'] != null
            && this.config['default'][parameterName] != null) {
            return this.config['default'][parameterName];
        } else {
            return defaultValue;
        }
    }

    // AWS CloudFormation スタックをデプロイする
    async deployStack(templateFilePath, stackName, bucketName) {
        await common.exec('aws cloudformation package --template-file ' + templateFilePath + ' --output-template-file ' + templateFilePath + ' --s3-bucket ' + bucketName + ' --use-json');
        await common.exec('aws cloudformation deploy --template-file ' + templateFilePath + ' --stack-name ' + stackName + ' --capabilities CAPABILITY_IAM');
    }

    async listFunctionApiPath(template) {
        template.Resources.forEach(resource => {
            console.log(resource);
        });
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

    // 作業用一時フォルダを削除する
    async deleteWorkingDirectory() {
        await fs.remove(this.workingDirPath);
    }

}