const fs = require('fs-extra');
const path = require('path');
const AWSClient = require('./awsClient');

module.exports = class KelchDeploy {

    constructor(config, workingDirPath = path.join(__dirname, '.tmp')) {
        this.config = config;
        this.workingDirPath = workingDirPath;
    }

    async deploy(stackName, bucketName) {
        try {

            // デプロイ用に作業フォルダを作成する
            await this.createWorkingDirectory();

            // AWS CloudFormation テンプレートを生成してファイル出力する
            const userCodesPath = '.';
            var template = await this.createTeamplte(userCodesPath);
            console.log('Creating upload artifacts and AWS CloudFormation template file');
            const templateFilePath = path.join(this.workingDirPath, 'template.json');
            await this.outputTemplateFile(template, templateFilePath)

            // AWS CloudFormation スタックをデプロイする            
            await AWSClient.deployStack(templateFilePath, stackName, bucketName);
            var apiPaths = this.listFunctionsApiPath(template);
            await this.displayEndpoint(stackName, apiPaths);

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

    async createTeamplte(userCodesPath) {

        // Read template file of AWS CloudFormation template
        var template = await fs.readJSON(path.join(__dirname, 'template', 'cloudformation-template-base.json'));

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
                timeout: this.getFunctionParameter(fileName, 'timeout', 3),
                memorySize: this.getFunctionParameter(fileName, 'memorySize', 128),
                runtime: this.getFunctionParameter(fileName, 'runtime', 'nodejs8.10'),
                policies: this.getFunctionPolicies(fileName),
                enviroments: this.getFunctionParameter(fileName, 'enviroments', {}),
                tags: this.getFunctionParameter(fileName, 'tags', {}),
                reservedConcurrentExecutions: this.getFunctionParameter(fileName, 'reservedConcurrentExecutions', null),
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
                    Policies: properties.policies,
                    Environment: {
                        Variables: properties.enviroments
                    },
                    Tags: properties.tags,
                    ReservedConcurrentExecutions: properties.reservedConcurrentExecutions,
                    Events: {
                        APIGateway: {
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
            if (properties.reservedConcurrentExecutions) {
                template.Resources[logicalName].Properties.ReservedConcurrentExecutions = properties.reservedConcurrentExecutions
            }
        }
        return template;
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

    getFunctionPolicies(functionName) {
        var resources = this.getFunctionParameter(functionName, 'policies');
        var policies = [{
            Version: '2012-10-17',
            Statement: []
        }];
        for (var resource in resources) {
            var actions = resources[resource];
            policies[0].Statement.push({
                Effect: 'Allow',
                Action: actions,
                Resource: resource
            });
        }
        return policies;
    }

    // 指定した AWS CloudFormation テンプレート(JSON)をファイルとして出力する
    async outputTemplateFile(template, outputPath) {
        await fs.writeFile(outputPath, JSON.stringify(template));
    }

    // テンプレートで設定されたFunctionのAPIパス一覧を返す
    listFunctionsApiPath(template) {
        var apiPaths = [];
        for (var logicalName in template.Resources) {
            if (logicalName == 'KelchAPIGateway') continue;
            var resource = template.Resources[logicalName];
            apiPaths.push(resource.Properties.Events.APIGateway.Properties.Path);
        }
        return apiPaths;
    }

    // 生成した API Gateway のエンドポイントを表示する
    async displayEndpoint(stackName, apiPaths) {
        var outputs = await AWSClient.getStackOutput(stackName);
        var endpoint = outputs['KelchAPIGatewayOutput'];
        if (!endpoint) return;
        console.log('REST APIs URL:');
        apiPaths.forEach(apiPath => console.log(endpoint + apiPath.replace('/', '')));
        console.log('');
    }

    // 作業用一時フォルダを削除する
    async deleteWorkingDirectory() {
        await fs.remove(this.workingDirPath);
    }

}