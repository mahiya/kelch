'use strict';
const chai = require('chai');
const assert = chai.assert;

describe('cloudFormationClient.js.js', function () {

    const CloudFormationClient = require('../src/cloudFormationClient.js');
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
        var result = await CloudFormationClient.getStackOutput(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'KelchAPIGatewayOutput', 'check: having property "KelchAPIGatewayOutput"');
    });

    it('getStackInfo', async () => {
        var result = await CloudFormationClient.getStackInfo(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'StackId', 'check: having property "StackId"');
    });

    it('createBucketIfNotExists', async () => {
    });

    it('getAccountId', async () => {
        var result = await CloudFormationClient.getAccountId();
        assert.typeOf(result, 'string', 'check: type of result');
    });

});

