const fs = require('fs-extra');
const path = require('path');
const common = require('./commands/common');

// コマンドを解析して適切なメソッドを呼び出す
exports.run = async function () {

    if (checkParameterIsExists('--version')) {
        await version();
        return;
    }

    var command = getCommand();
    if (checkParameterIsExists('--help') || command == null) {
        usage();
        return;
    }

    switch (command) {
        case 'init':
            await init()
            break;
        case 'create-resource':
            await createResource();
            break;
        case 'create-config':
            await createConfig();
            break;
        case 'update-config':
            await updateConfig();
            break;
        case 'deploy':
            await deploy()
            break;
        case 'delete':
            await del()
            break;
        default:
            usage();
    }
}

// $ kelch --help
function usage() {
    console.log(`
Usage: kelch [OPTIONS] COMMAND [ARGS]...

Options:
    --version
    --help

Commands:
    init
        --stack-name    (optional, default: directory name)
        --s3-bucket     (optional, default: directory name)
    create-resource
        --name          (required)
    create-config
    deploy
        --stack-name    (optional, default: directory name)
        --s3-bucket     (optional, default: directory name)
    delete
        --stack-name    (optional, default: directory name)
    `);
}

// $ kelch --version
async function version() {
    var packageJsonPath = path.join(__dirname, 'package.json');
    var packageJson = await fs.readFile(packageJsonPath, { encoding: 'utf-8' });
    var version = JSON.parse(packageJson)['version'];
    console.log('Kelch, version %s', version);
}

// $ kelch init
async function init() {
    var stackName = getStackName();
    var s3BucketName = getS3BucketName();
    await require('./commands/init').run(stackName, s3BucketName);
}

// $ kelch create-resoure
async function createResource() {
    var resourceName = getParameter('--name');
    if (resourceName == null) {
        usage();
        return;
    }
    await require('./commands/create-resource').run(resourceName);
}

// $ kelch create-config
async function createConfig() {
    await require('./commands/create-config').run();
}

// $ kelch update-config
async function updateConfig() {
    await require('./commands/update-config').run();
}

// $ kelch deloy
async function deploy() {
    var stackName = getStackName();
    var s3BucketName = getS3BucketName();
    await require('./commands/deploy').run(stackName, s3BucketName);
}

// $ kelch delete
async function del() {
    var stackName = getStackName();
    await require('./commands/delete').run(stackName);
}

// プログラム実行時に指定されたコマンドを返す
function getCommand() {
    return process.argv.length < 2 ? null : process.argv[2];
}

// 指定されたパラメータの値を返す。指定していない場合はデフォルト値を返す
function getParameter(parameterName, defaultValue = null) {
    var parameters = getParameters();
    return parameters[parameterName] == undefined
        ? defaultValue
        : parameters[parameterName];
}

// 指定されたパラメータが入力されているかを返す
function checkParameterIsExists(parameterName) {
    return getParameters()[parameterName] != undefined;
}

// プログラム実行時に入力されたパラメータを返す
var _cachedParameters;
function getParameters() {
    if (!_cachedParameters) {
        _cachedParameters = {};
        for (var i = 0; i < process.argv.length; i++) {
            if (!process.argv[i].startsWith('--')) continue;
            if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
                _cachedParameters[process.argv[i]] = process.argv[i + 1];
                i++;
            } else {
                _cachedParameters[process.argv[i]] = '';
            }
        }
    }
    return _cachedParameters;
}

function getStackName() {
    var stackName = getParameter("--stack-name");
    if (stackName != null) return stackName;

    var config = common.getConfig();
    if (config['stackName']) {
        return config['stackName'];
    }

    return common.getCurrentDirName();
}

function getS3BucketName() {
    var bucketName = getParameter("--s3-bucket");
    if (bucketName != null) return bucketName;

    var config = common.getConfig();
    if (config['s3BucketName']) {
        return config['s3BucketName'];
    }

    return common.getCurrentDirName();
}
