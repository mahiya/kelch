module.exports = class KelchCommand {

    async init() {
        await this.createResource('sample');
        await this.createConfig();
    }

    async createResource(resourceName) {
        const templateCodePath = path.join(__dirname, 'template', 'resource-template.js');
        var templateCode = await fs.readFile(templateCodePath, { encoding: 'utf-8' });
        await fs.writeFile(resourceName + '.js', templateCode);
    }

    async createConfig() {
        var parameters = await fs.readJSON(path.join(__dirname, 'template', 'config-template.json'));

        var dirName = common.getCurrentDirName();
        parameters['stackName'] = dirName;
        parameters['s3BucketName'] = dirName;

        var files = (await fs.readdir('.')).filter(file => path.extname(file).toLowerCase() == '.js');
        for (var i = 0; i < files.length; i++) {
            parameters['functions'][files[i]] = {};
        }

        await fs.writeFileSync('kelch-config.json', JSON.stringify(parameters, null, 2));
    }

    async updateConfig() {

    }

    async deleteStack(stackName) {
        await common.exec('aws cloudformation delete-stack --stack-name ' + stackName);
    }

}
