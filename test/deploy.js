'use strict';
const chai = require('chai');
const fs = require('fs-extra');
const expect = chai.expect;
const assert = chai.assert;

describe('deploy.js', function () {

    const KelchDeploy = require('../src/deploy.js');
    const stackName = 'kelch-test';

    it('createTeamplte', async () => {
        const workingDirPath = 'test/.tmp';
        await fs.remove(workingDirPath);
        await fs.mkdir(workingDirPath);
        try {
            var kelchDeploy = new KelchDeploy();
            var result = await kelchDeploy.createTeamplte(workingDirPath, 'test/sample-project');
            assert.typeOf(result, 'object', 'check: type of result');
            assert.property(result, 'templateFilePath', 'check: having property "templateFilePath"');
            assert.property(result, 'apiPaths', 'check: having property "apiPaths"');
        } finally {
            await fs.remove(workingDirPath);
        }
    });

    it('getStackInfo', async () => {
        var kelchDeploy = new KelchDeploy();
        var result = await kelchDeploy.getStackInfo(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'StackId', 'check: having property "StackId"');
    });

    it('getStackOutput', async () => {
        var kelchDeploy = new KelchDeploy();
        var result = await kelchDeploy.getStackOutput(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'KelchAPIGatewayOutput', 'check: having property "KelchAPIGatewayOutput"');
    });

    it('displayEndpoint', async () => {
        var kelchDeploy = new KelchDeploy();
        await kelchDeploy.displayEndpoint(stackName, ['/test', '/test/todo']);
    });

});

