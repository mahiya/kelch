const common = require('./common');

module.exports = class KelchDelete {

    constructor() {

    }

    async deleteStack(stackName) {
        await common.exec('aws cloudformation delete-stack --stack-name ' + stackName);
    }

}
