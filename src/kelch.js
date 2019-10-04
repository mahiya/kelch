const fs = require('fs-extra');
const path = require('path');
const common = require('./common');
const KelchCommand = require('./command');
const KelchDeploy = require('./deploy');

module.exports = class Kelch {

    constructor(argv, configFilePath = path.join('.', 'kelch-config.json')) {
        this.command = this.getCommand(argv);
        this.parameters = this.getParameters(argv);
        this.config = this.getConfig(configFilePath);
    }

    async run() {

        if (this.checkParameterIsExists('--version')) {
            await this.version();
            return;
        }

        if (this.checkParameterIsExists('--help') || this.command == null) {
            this.usage();
            return;
        }

        switch (this.command) {
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
        var packageJsonPath = path.join(__dirname, '../package.json');
        var packageJson = await fs.readFile(packageJsonPath, { encoding: 'utf-8' });
        var version = JSON.parse(packageJson)['version'];
        console.log('Kelch, version %s', version);
    }

    // $ kelch init
    async init() {
        const KelchCommand = require('./command');
        var kelchCommand = new KelchCommand();
        var stackName = this.getStackName();
        var s3BucketName = this.getS3BucketName();
        await kelchCommand.init(stackName, s3BucketName);
    }

    // $ kelch create-resoure
    async createResource() {
        var resourceName = this.getParameter('--name');
        if (resourceName == null) {
            this.usage();
            return;
        }
        var command = new KelchCommand();
        await command.createResource(resourceName);
    }

    // $ kelch create-config
    async createConfig() {
        var command = new KelchCommand();
        await command.createConfig();
    }

    // $ kelch update-config
    async updateConfig() {
        var command = new KelchCommand();
        await command.updateConfig();
    }

    // $ kelch deloy
    async deploy() {
        var kelchDeploy = new KelchDeploy();
        var stackName = this.getStackName();
        var s3BucketName = this.getS3BucketName();
        kelchDeploy.deploy(stackName, s3BucketName);
    }

    // $ kelch delete
    async del() {
        var command = new KelchCommand();
        var stackName = this.getStackName();
        await command.deleteStack(stackName);
    }

    // プログラム実行時に指定されたコマンドを返す
    getCommand(argv) {
        return argv.length < 2 ? null : argv[2];
    }

    // プログラム実行時に入力されたパラメータを返す
    getParameters(argv) {
        var parameters = {};
        for (var i = 0; i < argv.length; i++) {
            if (!argv[i].startsWith('--')) continue;
            if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
                parameters[argv[i]] = argv[i + 1];
                i++;
            } else {
                parameters[argv[i]] = '';
            }
        }
        return parameters;
    }

    // 指定されたパラメータの値を返す。指定していない場合はデフォルト値を返す
    getParameter(parameterName, defaultValue = null) {
        return this.parameters[parameterName] == undefined
            ? defaultValue
            : this.parameters[parameterName];
    }

    // 指定されたパラメータが入力されているかを返す
    checkParameterIsExists(parameterName) {
        return this.parameters[parameterName] != undefined;
    }

    getStackName() {
        var stackName = this.getParameter("--stack-name");
        if (stackName != null) return stackName;

        if (this.config['stackName']) {
            return this.config['stackName'];
        }

        return common.getCurrentDirName();
    }

    getS3BucketName() {
        var bucketName = this.getParameter("--s3-bucket");
        if (bucketName != null) return bucketName;

        if (this.config['s3BucketName']) {
            return this.config['s3BucketName'];
        }

        return common.getCurrentDirName();
    }

    getConfig(configPath) {
        if (fs.existsSync(configPath)) {
            return fs.readJSONSync(configPath);
        } else {
            return {};
        }
    }
}
