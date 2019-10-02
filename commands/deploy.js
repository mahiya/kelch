const fs = require('fs-extra');
const path = require('path');
const common = require('./common');

const AWS = require('aws-sdk');
AWS.config.region = common.getRegion();

exports.run = async (stackName, bucketName) => {
    const workingDirPath = path.join(__dirname, '.tmp');
    try {
        await createWorkingDirectory(workingDirPath);
        await createBucketIfNotExists(bucketName);
        var templateFilePath = await createTeamplte(workingDirPath);
        await deploy(templateFilePath, stackName, bucketName);
    } catch (e) {
        console.error(e);
    } finally {
        await deleteWorkingDirectory(workingDirPath);
    }
}

async function createTeamplte(workingDirPath) {

    console.log('Creating AWS CloudFormation template file ...');

    // Read template file of AWS CloudFormation template
    var template = await fs.readJSON(path.join(__dirname, 'base-template.json'));

    // Read the code that will be attached with user's codes
    var handlerCode = await fs.readFile(path.join(__dirname, 'handler.js'), { encoding: 'utf-8' });

    // Get JavaScript file names
    const userCodesPath = '.';
    var fileNames = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');

    // 各JavaScriptファイルごとに処理をする
    for (var i = 0; i < fileNames.length; i++) {
        var fileName = fileNames[i];

        // リソース名を取得する
        var resourceName = path.basename(fileName, path.extname(fileName));

        // 各JSファイルごとにフォルダを作成する
        var codeDirName = resourceName;
        var functionDirPath = path.join(workingDirPath, codeDirName);
        console.log('Creating Lambda function folder: %s', functionDirPath);
        await fs.mkdir(functionDirPath);

        // 対象のJSファイルのコードを読み込む
        var userCode = await fs.readFile(path.join(userCodesPath, fileName), { encoding: 'utf-8' });

        // HandlerコードとマージしたJSファイルを作成する
        await fs.writeFile(path.join(functionDirPath, fileName), userCode + "\n" + handlerCode);

        // node_modulesフォルダをコピーする
        if (await fs.exists('node_modules')) {
            console.log('Copying node_modules directory to %s', functionDirPath);
            await fs.copy('node_modules', path.join(functionDirPath, 'node_modules'));
        }

        // 関数の設定を定義する
        var properties = {
            "timeout": getFunctionParameter(fileName, 'timeout', 3),
            "memorySize": getFunctionParameter(fileName, 'memorySize', 128),
            "runtime": getFunctionParameter(fileName, 'runtime', 'nodejs8.10'),
        };

        // ResourcesにLambda Function リソースを追加する
        var logicalName = resourceName.match(/[0-9a-zA-Z]+/g).join("");
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

    // 生成した AWS CloudFormation テンプレートをファイルとして出力する
    const templateFilePath = path.join(workingDirPath, 'template.json');
    console.log('Outputting  AWS CloudFormation template file: %s', templateFilePath);
    await fs.writeFile(templateFilePath, JSON.stringify(template));
    return templateFilePath;
}

// 設定ファイル(kelch-config.json)での設定値を取得する
function getFunctionParameter(functionName, parameterName, defaultValue) {
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
async function deploy(templateFilePath, stackName, bucketName) {
    await common.exec('aws cloudformation package --template-file ' + templateFilePath + ' --output-template-file ' + templateFilePath + ' --s3-bucket ' + bucketName + ' --use-json');
    await common.exec('aws cloudformation deploy --template-file ' + templateFilePath + ' --stack-name ' + stackName + ' --capabilities CAPABILITY_IAM');
}

async function getStackOutput(stackName) {
    var stack = await getStackInfo(stackName);
    if (!stack['Outputs']) return {};
    return stack['Outputs'];
}

async function getStackInfo(stackName) {
    var outputs = await common.exec('aws cloudformation describe-stacks --stack-name ' + stackName);
    if (outputs.length < 1) return null;
    var stacks = JSON.parse(outputs[0]);
    if (stacks['Stacks'].length < 1) return null;
    return stacks[0];
}

// 作業用一時フォルダを作成する
async function createWorkingDirectory(path) {
    console.log("Creating temporary working directory ...")
    await fs.remove(path);
    await fs.mkdir(path);
}

// 作業用一時フォルダを削除する
async function deleteWorkingDirectory(path) {
    console.log("Deleting temporary working directory ...")
    await fs.remove(path);
}

// 指定したS3バケットが存在しない場合は作成する
async function createBucketIfNotExists(bucketName) {
    var s3 = new AWS.S3();
    try {
        console.log("Checking S3 bucket '%s' is exists ...", bucketName);
        await s3.headBucket({ Bucket: bucketName }).promise();
    } catch (e) {
        if (e.statusCode != 404) throw e;
        // HTTP status code が 404 の場合は存在しないので作成する
        console.log("Creating S3 bucket '%s' ...", bucketName);
        await s3.createBucket({ Bucket: bucketName }).promise();
    }
}
