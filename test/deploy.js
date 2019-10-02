'use strict';
const chai = require('chai');
const fs = require('fs-extra');
const expect = chai.expect;
const assert = chai.assert;

describe('commands/deploy.js', function () {

    var app = require('../commands/deploy');
    const stackName = 'kelch-test';

    it('createTeamplte', async () => {
        const workingDirPath = 'test/.tmp';
        await fs.remove(workingDirPath);
        await fs.mkdir(workingDirPath);
        try {
            var result = await app.createTeamplte(workingDirPath, 'test/sample-project');
            assert.typeOf(result, 'object', 'check: type of result');
            assert.property(result, 'templateFilePath', 'check: having property "templateFilePath"');
            assert.property(result, 'apiPaths', 'check: having property "apiPaths"');
        } finally {
            await fs.remove(workingDirPath);
        }
    });

    it('getStackInfo', async () => {
        var result = await app.getStackInfo(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'StackId', 'check: having property "StackId"');
    });

    it('getStackOutput', async () => {
        var result = await app.getStackOutput(stackName);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, 'KelchAPIGatewayOutput', 'check: having property "KelchAPIGatewayOutput"');
    });

    it('displayEndpoint', async () => {
        await app.displayEndpoint(stackName, ['/test', '/test/todo']);
    });

});

