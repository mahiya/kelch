const chai = require('chai');
const assert = chai.assert;

describe('kelch.js', function () {

    const Kelch = require('../kelch.js');

    it('getParameter - Exists', async () => {
        const stackName = 'sample-stack';
        var argv = ['node', 'kelch', 'deploy', '--stackName', stackName, '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.getParameter('--stackName', 'default-value');
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, stackName);
    });

    it('getParameter - NotExists', async () => {
        const defaultValue = 'default-value';
        var argv = ['node', 'kelch', 'deploy'];
        var kelch = new Kelch(argv);
        var result = await kelch.getParameter('--stackName', defaultValue);
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, defaultValue);
    });

    it('checkParameterIsExists - Exists', async () => {
        var argv = ['node', 'kelch', 'deploy', '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.checkParameterIsExists('--version');
        assert.typeOf(result, 'boolean', 'check: type of result');
        assert.equal(result, true);
    });

    it('checkParameterIsExists - NotExists', async () => {
        var argv = ['node', 'kelch', 'deploy', '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.checkParameterIsExists('--help');
        assert.typeOf(result, 'boolean', 'check: type of result');
        assert.equal(result, false);
    });

    it('getParameters', async () => {
        const stackName = 'sample-stack';
        var argv = ['node', 'kelch', 'deploy', '--stackName', stackName, '--version'];
        var kelch = new Kelch(argv);
        var result = await kelch.getParameters();
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, '--stackName', 'check: having property "stackName"');
        assert.equal(result['--stackName'], stackName);
        assert.property(result, '--version', 'check: having property "stackname"');
    });

});

