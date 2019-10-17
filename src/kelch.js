const fs = require('fs-extra');
const path = require('path');
const KelchCommand = require('./command');
const AWSClient = require('./awsClient');
const usage = `
Usage: kelch COMMAND [ARGS]...

Options:
    --version
    --help

Commands:
    init
        --stack-name    (optional)
        --s3-bucket     (optional)
        --detailed      (optional)
    create-resource
        --name          (required)
    create-config
        --stack-name    (optional)
        --s3-bucket     (optional)
        --detailed      (optional)
    deploy
        --stack-name    (optional)
        --s3-bucket     (optional)
    delete
        --stack-name    (optional)
`;

module.exports = class Kelch {

    constructor(argv, configFilePath = path.join('.', 'kelch-config.json')) {
        this.command = this.getCommand(argv);
        this.parameters = this.getParameters(argv);
        this.config = this.getConfig(configFilePath);
    }

    // $ kelch
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
        console.log(usage);
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
        var stackName = this.getStackName();
        var s3BucketName = await this.getS3BucketName();
        var detailed = this.checkParameterIsExists('--detailed');
        await KelchCommand.init(stackName, s3BucketName, detailed);
    }

    // $ kelch create-resoure
    async createResource() {
        var resourceName = this.getParameter('--name');
        if (resourceName == null) {
            this.usage();
            return;
        }
        await KelchCommand.createResource(resourceName);
    }

    // $ kelch create-config
    async createConfig() {
        var stackName = this.getStackName();
        var s3BucketName = await this.getS3BucketName();
        var detailed = this.checkParameterIsExists('--detailed');
        await KelchCommand.createConfig(stackName, s3BucketName, detailed);
    }

    // $ kelch deloy
    async deploy() {
        var stackName = this.getStackName();
        var s3BucketName = await this.getS3BucketName();
        await KelchCommand.deploy(this.config, stackName, s3BucketName);
    }

    // $ kelch delete
    async del() {
        var stackName = this.getStackName();
        await KelchCommand.deleteStack(stackName);
    }

    getCommand(argv) {
        return argv.length < 2 ? null : argv[2];
    }

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

    getConfig(configPath) {
        if (fs.existsSync(configPath)) {
            return fs.readJSONSync(configPath);
        } else {
            return {};
        }
    }

    getParameter(parameterName, defaultValue = null) {
        return this.parameters[parameterName] == undefined
            ? defaultValue
            : this.parameters[parameterName];
    }

    checkParameterIsExists(parameterName) {
        return this.parameters[parameterName] != undefined;
    }

    getStackName() {
        var stackName = this.getParameter("--stack-name");
        if (stackName != null) return stackName;

        if (this.config['stackName']) {
            return this.config['stackName'];
        }

        // default stack name is directory name if stack name is not inputed by program arguments or config file
        var defaultStackName = path.basename(process.cwd());
        return defaultStackName;
    }

    async getS3BucketName() {
        var bucketName = this.getParameter("--s3-bucket");
        if (bucketName != null) return bucketName;

        if (this.config['s3BucketName']) {
            return this.config['s3BucketName'];
        }

        var defaultBucketName = await AWSClient.getDefaultS3BucketName();
        return defaultBucketName;
    }

}
