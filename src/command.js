const KelchCommon = require('./common');
const KelchDeploy = require('./deploy')
const fs = require('fs-extra');
const path = require('path');
const CloudFormationClient = require('./cloudFormationClient');

module.exports = class KelchCommand {

    static async init(stackName, s3BucketName, userCodesPath = '.', destDirPath = '.') {
        await this.createResource('sample', destDirPath);
        await this.createConfig(stackName, s3BucketName, userCodesPath, destDirPath);
    }

    static async createResource(resourceName, destDirPath = '.') {
        const templateCodePath = path.join(__dirname, 'template', 'resource-template.js');
        var templateCode = await fs.readFile(templateCodePath, { encoding: 'utf-8' });
        var newFilePath = path.join(destDirPath, resourceName + '.js');
        await fs.writeFile(newFilePath, templateCode);
    }

    static async createConfig(stackName, s3BucketName, userCodesPath = '.', destDirPath = '.') {
        var parameters = await fs.readJSON(path.join(__dirname, 'template', 'config-template.json'));
        parameters['stackName'] = stackName;
        parameters['s3BucketName'] = s3BucketName;

        var files = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');
        for (var i = 0; i < files.length; i++) {
            parameters['functions'][files[i]] = {};
        }

        const configFileName = 'kelch-config.json';
        var configFilePath = path.join(destDirPath, configFileName);
        await fs.writeFileSync(configFilePath, JSON.stringify(parameters, null, 2));
    }

    static async updateConfig() {

    }


    static async deploy(config, stackName, s3BucketName) {
        var kelchDeploy = new KelchDeploy(config);
        await kelchDeploy.deploy(stackName, s3BucketName);
    }

    static async deleteStack(stackName) {
        await CloudFormationClient.deleteStack(stackName);
    }

}
