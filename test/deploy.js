'use strict';
const chai = require('chai');
const fs = require('fs-extra');
const expect = chai.expect;
const assert = chai.assert;

describe('deploy.js', function () {

    const KelchDeploy = require('../src/deploy.js');
    const stackName = 'kelch-test';
    const config = fs.readJSONSync('test/sample-project/kelch-config.json');

    it('createTeamplte', async () => {
        var kelchDeploy = new KelchDeploy(config, 'test/.tmp');
        try {
            await kelchDeploy.createWorkingDirectory();
            var result = await kelchDeploy.createTeamplte('test/sample-project');
            assert.typeOf(result, 'object', 'check: type of result');
        } finally {
            await kelchDeploy.deleteWorkingDirectory();
        }
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

    it('displayEndpoint', async () => {
        var kelchDeploy = new KelchDeploy();
        await kelchDeploy.displayEndpoint(stackName, ['/test', '/test/todo']);
    });

});

