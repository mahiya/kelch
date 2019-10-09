'use strict';
const chai = require('chai');
const assert = chai.assert;

describe('awsClient.js', function () {

    const AWSClient = require('../src/awsClient.js');
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
        var result = await AWSClient.getStackOutput(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'KelchAPIGatewayOutput', 'check: having property "KelchAPIGatewayOutput"');
    });

    it('getStackInfo', async () => {
        var result = await AWSClient.getStackInfo(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'StackId', 'check: having property "StackId"');
    });

    it('createBucketIfNotExists', async () => {
    });

    it('getAccountId', async () => {
        var result = await AWSClient.getAccountId();
        assert.typeOf(result, 'string', 'check: type of result');
    });

});

