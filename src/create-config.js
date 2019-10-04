const fs = require('fs-extra');
const path = require('path');
const common = require('./common');

exports.run = async () => {
    var parameters = await fs.readJSON(path.join(__dirname, 'create-config-template.json'));

    var dirName = common.getCurrentDirName();
    parameters['stackName'] = dirName;
    parameters['s3BucketName'] = dirName;

    var files = (await fs.readdir('.')).filter(file => path.extname(file).toLowerCase() == '.js');
    for (var i = 0; i < files.length; i++) {
        parameters['functions'][files[i]] = {};
    }

    await fs.writeFileSync('kelch-config.json', JSON.stringify(parameters, null, 2));
}