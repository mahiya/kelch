'use strict';
const chai = require('chai');
const assert = chai.assert;

describe('cloudFormationClient.js.js', function () {

    const KelchDeploy = require('../src/deploy.js');
    const stackName = 'kelch-test';

    before(async () => {

    });

    after(async () => {

    });

    it('deployStack', async () => {
    });

    it('deleteStack', async () => {
    });

    it('getStackOutput', async () => {
        var kelchDeploy = new KelchDeploy();
        var result = await kelchDeploy.getStackOutput(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'KelchAPIGatewayOutput', 'check: having property "KelchAPIGatewayOutput"');
    });

    it('getStackInfo', async () => {
        var kelchDeploy = new KelchDeploy();
        var result = await kelchDeploy.getStackInfo(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'StackId', 'check: having property "StackId"');
    });

    it('createBucketIfNotExists', async () => {
    });

});

