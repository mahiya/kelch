const fs = require('fs-extra');
const path = require('path');
const common = require('./commands/common');

module.exports = class Kelch {
    constructor(argv) {
        this.argv = argv;
        this.cachedParameters = null;
    }

    async run() {

        if (this.checkParameterIsExists('--version')) {
            await this.version();
            return;
        }

        var command = this.getCommand();
        if (this.checkParameterIsExists('--help') || command == null) {
            this.usage();
            return;
        }

        switch (command) {
            case 'init':
                await this.init()
                break;
            case 'create-resource':
                await this.createResource();
                break;
            case 'create-config':
                await this.createConfig();
                break;
            case 'update-config':
                await this.updateConfig();
                break;
            case 'deploy':
                await this.deploy()
                break;
            case 'delete':
                await this.del()
                break;
            default:
                this.usage();
        }
    }

    // $ kelch --help
    usage() {
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
    async version() {
        var packageJsonPath = path.join(__dirname, 'package.json');
        var packageJson = await fs.readFile(packageJsonPath, { encoding: 'utf-8' });
        var version = JSON.parse(packageJson)['version'];
        console.log('Kelch, version %s', version);
    }

    // $ kelch init
    async init() {
        var stackName = this.getStackName();
        var s3BucketName = this.getS3BucketName();
        await require('./commands/init').run(stackName, s3BucketName);
    }

    // $ kelch create-resoure
    async createResource() {
        var resourceName = this.getParameter('--name');
        if (resourceName == null) {
            this.usage();
            return;
        }
        await require('./commands/create-resource').run(resourceName);
    }

    // $ kelch create-config
    async createConfig() {
        await require('./commands/create-config').run();
    }

    // $ kelch update-config
    async updateConfig() {
        await require('./commands/update-config').run();
    }

    // $ kelch deloy
    async deploy() {
        var stackName = this.getStackName();
        var s3BucketName = this.getS3BucketName();
        await require('./commands/deploy').run(stackName, s3BucketName);
    }

    // $ kelch delete
    async del() {
        var stackName = this.getStackName();
        await require('./commands/delete').run(stackName);
    }

    // プログラム実行時に指定されたコマンドを返す
    getCommand() {
        return this.argv.length < 2 ? null : this.argv[2];
    }

    // 指定されたパラメータの値を返す。指定していない場合はデフォルト値を返す
    getParameter(parameterName, defaultValue = null) {
        var parameters = this.getParameters();
        return parameters[parameterName] == undefined
            ? defaultValue
            : parameters[parameterName];
    }

    // 指定されたパラメータが入力されているかを返す
    checkParameterIsExists(parameterName) {
        return this.getParameters()[parameterName] != undefined;
    }

    // プログラム実行時に入力されたパラメータを返す
    getParameters() {
        if (!this.cachedParameters) {
            this.cachedParameters = {};
            for (var i = 0; i < this.argv.length; i++) {
                if (!this.argv[i].startsWith('--')) continue;
                if (i + 1 < this.argv.length && !this.argv[i + 1].startsWith('--')) {
                    this.cachedParameters[this.argv[i]] = this.argv[i + 1];
                    i++;
                } else {
                    this.cachedParameters[this.argv[i]] = '';
                }
            }
        }
        return this.cachedParameters;
    }

    getStackName() {
        var stackName = this.getParameter("--stack-name");
        if (stackName != null) return stackName;

        var config = common.getConfig();
        if (config['stackName']) {
            return config['stackName'];
        }

        return common.getCurrentDirName();
    }

    getS3BucketName() {
        var bucketName = this.getParameter("--s3-bucket");
        if (bucketName != null) return bucketName;

        var config = common.getConfig();
        if (config['s3BucketName']) {
            return config['s3BucketName'];
        }

        return common.getCurrentDirName();
    }

}
