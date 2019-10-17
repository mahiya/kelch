const KelchDeploy = require('./deploy')
const fs = require('fs-extra');
const path = require('path');
const AWSClient = require('./awsClient');
const configFileName = 'kelch-config.json';

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
        var configFilePath = path.join(destDirPath, configFileName);
        if (fs.existsSync(configFilePath)) {
            console.log(`Config file '${configFileName}' already exists`)
            return;
        }

        var parameters = await fs.readJSON(path.join(__dirname, 'template', 'config-template.json'));
        parameters['stackName'] = stackName;
        parameters['s3BucketName'] = s3BucketName;

        var files = (await fs.readdir(userCodesPath)).filter(file => path.extname(file).toLowerCase() == '.js');
        for (var i = 0; i < files.length; i++) {
            parameters['functions'][files[i]] = {
                enviroments: {
                    key: "value"
                }
            };
        }

        await fs.writeFile(configFilePath, JSON.stringify(parameters, null, 2));
    }

    static async deploy(config, stackName, s3BucketName) {
        var kelchDeploy = new KelchDeploy(config);
        await kelchDeploy.deploy(stackName, s3BucketName);
    }

    static async deleteStack(stackName) {
        await AWSClient.deleteStack(stackName);
    }

}
