const chai = require('chai');
const fs = require('fs-extra');
const assert = chai.assert;

describe('kelch.js', function () {

    const Kelch = require('../kelch.js');

    it('getCommand', async () => {
        var argv = ['node', 'kelch', 'deploy'];
        var kelch = new Kelch(argv);
        var result = await kelch.getCommand(argv);
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, 'deploy', 'check: result value');
    });

    it('getParameters', async () => {
        const stackName = 'sample-stack';
        var argv = ['node', 'kelch', 'deploy', '--stack-name', stackName, '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.getParameters(argv);
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, '--stack-name', 'check: having property "stackName"');
        assert.equal(result['--stack-name'], stackName, 'check: stackName value');
        assert.property(result, '--version', 'check: having property "stackname"');
    });

    it('getParameter - Exists', async () => {
        const stackName = 'sample-stack';
        var argv = ['node', 'kelch', 'deploy', '--stack-name', stackName, '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.getParameter('--stack-name', 'default-value');
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, stackName, 'check: result value');
    });

    it('getParameter - NotExists', async () => {
        const defaultValue = 'default-value';
        var argv = ['node', 'kelch', 'deploy'];
        var kelch = new Kelch(argv);
        var result = await kelch.getParameter('--stack-name', defaultValue);
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, defaultValue, 'check: result value');
    });

    it('checkParameterIsExists - Exists', async () => {
        var argv = ['node', 'kelch', 'deploy', '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.checkParameterIsExists('--version');
        assert.typeOf(result, 'boolean', 'check: type of result');
        assert.equal(result, true, 'check: result value');
    });

    it('checkParameterIsExists - NotExists', async () => {
        var argv = ['node', 'kelch', 'deploy', '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.checkParameterIsExists('--help');
        assert.typeOf(result, 'boolean', 'check: type of result');
        assert.equal(result, false, 'check: result value');
    });

    it('getStackName - from process parameters', async () => {
        const stackNameByParameter = 'stack-name-by-parameter';
        var argv = ['node', 'kelch', 'deploy', '--stack-name', stackNameByParameter];
        var kelch = new Kelch(argv, './test/kelch-configs/kelch-config.json');
        var result = kelch.getStackName();
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, stackNameByParameter, 'check: result value');
    });

    it('getStackName - from config file', async () => {
        var argv = ['node', 'kelch', 'deploy'];
        var kelch = new Kelch(argv, './test/kelch-configs/kelch-config.json');
        var result = kelch.getStackName();
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, 'stack-name-by-config', 'check: result value');
    });

    it('getStackName - default - config file exists', async () => {
        var argv = ['node', 'kelch', 'deploy'];
        var kelch = new Kelch(argv, './test/kelch-configs/kelch-config-empty.json');
        var result = kelch.getStackName();
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, 'kelch', 'check: result value');
    });

    it('getStackName - default - config file not exists', async () => {
        var argv = ['node', 'kelch', 'deploy'];
        var kelch = new Kelch(argv, './test/kelch-configs/kelch-config-not-exists.json');
        var result = kelch.getStackName();
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, 'kelch', 'check: result value');
    });

});

