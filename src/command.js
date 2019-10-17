const KelchDeploy = require('./deploy')
const fs = require('fs-extra');
const path = require('path');
const AWSClient = require('./awsClient');
const configFileName = 'kelch-config.json';

module.exports = class KelchCommand {

    // $ kelch init [--stack-name] [--s3-bucket] [--detailed]
    static async init(stackName, s3BucketName, detailed, userCodesPath = '.', destDirPath = '.') {
        await this.createResource('sample', destDirPath);
        await this.createConfig(stackName, s3BucketName, detailed, userCodesPath, destDirPath);
    }

    // $ kelch create-resource [--stack-name] [--s3-bucket]
    static async createResource(resourceName, destDirPath = '.') {
        const templateCodePath = path.join(__dirname, 'template', 'resource-template.js');
        var templateCode = await fs.readFile(templateCodePath, { encoding: 'utf-8' });
        var newFilePath = path.join(destDirPath, resourceName + '.js');
        await fs.writeFile(newFilePath, templateCode);
    }

    // $ kelch create-config [--stack-name] [--s3-bucket] [--detailed]
    static async createConfig(stackName, s3BucketName, detailed, userCodesPath = '.', destDirPath = '.') {
        var configFilePath = path.join(destDirPath, configFileName);
        if (fs.existsSync(configFilePath)) {
            console.log(`Config file '${configFileName}' already exists`)
            return;
        }

        const configTemplateFileName = detailed ? 'config-template-detailed.json' : 'config-template.json';
        var parameters = await fs.readJSON(path.join(__dirname, 'template', configTemplateFileName));
        parameters['stackName'] = stackName;
        parameters['s3BucketName'] = s3BucketName;

        var files = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');
        for (var i = 0; i < files.length; i++) {
            parameters['functions'][files[i]] = {};
        }

        await fs.writeFile(configFilePath, JSON.stringify(parameters, null, 2));
    }

    // $ kelch deploy [--stack-name] [--s3-bucket]
    static async deploy(config, stackName, s3BucketName) {
        var kelchDeploy = new KelchDeploy(config);
        await kelchDeploy.deploy(stackName, s3BucketName);
    }

    // $ kelch delete [--stack-name] [--s3-bucket]
    static async deleteStack(stackName) {
        await AWSClient.deleteStack(stackName);
    }

}
