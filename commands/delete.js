const common = require('./common');

exports.run = async function (stackName) {
    await common.exec('aws cloudformation delete-stack --stack-name ' + stackName);
}