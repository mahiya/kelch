const KelchCommon = require('./common');
const fs = require('fs-extra');
const path = require('path');
const CloudFormationClient = require('./cloudFormationClient');

module.exports = class KelchCommand {

    async init(userCodesPath = '.', destDirPath = '.') {
        await this.createResource('sample', destDirPath);
        await this.createConfig(userCodesPath, destDirPath);
    }

    async createResource(resourceName, destDirPath = '.') {
        const templateCodePath = path.join(__dirname, 'template', 'resource-template.js');
        var templateCode = await fs.readFile(templateCodePath, { encoding: 'utf-8' });
        var newFilePath = path.join(destDirPath, resourceName + '.js');
        await fs.writeFile(newFilePath, templateCode);
    }

    async createConfig(userCodesPath = '.', destDirPath = '.') {
        var parameters = await fs.readJSON(path.join(__dirname, 'template', 'config-template.json'));

        var dirName = KelchCommon.getCurrentDirName();
        parameters['stackName'] = dirName;
        parameters['s3BucketName'] = dirName;

        var files = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');
        for (var i = 0; i < files.length; i++) {
            parameters['functions'][files[i]] = {};
        }

        const configFileName = 'kelch-config.json';
        var configFilePath = path.join(destDirPath, configFileName);
        await fs.writeFileSync(configFilePath, JSON.stringify(parameters, null, 2));
    }

    async updateConfig() {

    }


    async deploy(stackName, s3BucketName) {
        var kelchDeploy = new KelchDeploy();
        kelchDeploy.deploy(stackName, s3BucketName);
    }

    async deleteStack(stackName) {
        await CloudFormationClient.deleteStack(stackName);
    }

}
