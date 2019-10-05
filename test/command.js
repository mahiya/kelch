'use strict';
const chai = require('chai');
const fs = require('fs-extra');
const path = require('path');
const expect = chai.expect;
const assert = chai.assert;

describe('command.js', function () {

    const KelchCommand = require('../src/command.js');
    var command = new KelchCommand();

    const workingDirPath = path.join('.', 'test', '.work');
    beforeEach(async () => {
        await fs.remove(workingDirPath);
        await fs.mkdir(workingDirPath);
    });

    afterEach(async () => {
        await fs.remove(workingDirPath);
    });

    it('init', async () => {
        const userCodesPath = path.join('test', 'sample-project');
        const configFilePath = path.join(workingDirPath, 'kelch-config.json');
        await command.init(userCodesPath, workingDirPath);
        assert.equal(fs.existsSync(path.join(workingDirPath, 'sample.js')), true, 'check: created resource file is exists');
        assert.equal(fs.existsSync(configFilePath), true, 'check: created config file is exists');
    });

    it('createResource', async () => {
        const resourceName = 'create-resource-test';
        await command.createResource(resourceName, workingDirPath);
        assert.equal(fs.existsSync(path.join(workingDirPath, resourceName + '.js')), true, 'check: created resource file is exists');
    });

    it('createConfig', async () => {
        const userCodesPath = path.join('test', 'sample-project');
        const configFilePath = path.join(workingDirPath, 'kelch-config.json');
        const dirName = path.basename(process.cwd());

        await command.createConfig(userCodesPath, workingDirPath);
        assert.equal(fs.existsSync(configFilePath), true, 'check: created config file is exists');

        var config = await fs.readJSON(configFilePath);
        assert.property(config, 'stackName', 'check: config has property "stackName"');
        assert.equal(config.stackName, dirName, 'check: stackName value');
        assert.property(config, 's3BucketName', 'check: config has property "s3BucketName"');
        assert.equal(config.s3BucketName, dirName, 'check: s3BucketName value');
        assert.property(config, 'default', 'check: config has property "default"');
        assert.property(config.default, 'timeout', 'check: config has property "timeout" at default');
        assert.property(config.default, 'memorySize', 'check: config has property "memorySize" at default');
        assert.property(config.default, 'runtime', 'check: config has property "runtime" at default');
        assert.property(config, 'functions', 'check: config has property "functions"');
        assert.property(config.functions, 'test-api-1.js', 'check: config has each property of function at functions');
        assert.property(config.functions, 'test-api-2.js', 'check: config has each property of function at functions');
    });

    it('updateConfig', async () => {
    });

});

