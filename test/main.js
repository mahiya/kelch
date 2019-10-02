const chai = require('chai');
const assert = chai.assert;

describe('main.js', function () {

    var app = require('../main');
    const stackName = 'sample-stack';
    process.argv = ['node', 'kelch', 'deploy', '--stackName', stackName, '--version'];

    it('getParameter - Exists', async () => {
        const defaultValue = 'default-value';
        var result = await app.getParameter('--stackName', defaultValue);
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, stackName);
    });

    it('getParameter - NotExists', async () => {
        const defaultValue = 'default-value';
        var result = await app.getParameter('--stackNameX', defaultValue);
        assert.typeOf(result, 'string', 'check: type of result');
        assert.equal(result, defaultValue);
    });

    it('checkParameterIsExists - Exists', async () => {
        process.argv = ['node', 'kelch', 'deploy', '--version'];
        var result = await app.checkParameterIsExists('--version');
        assert.typeOf(result, 'boolean', 'check: type of result');
        assert.equal(result, true);
    });

    it('checkParameterIsExists - NotExists', async () => {
        process.argv = ['node', 'kelch', 'deploy', '--version'];
        var result = await app.checkParameterIsExists('--help');
        assert.typeOf(result, 'boolean', 'check: type of result');
        assert.equal(result, false);
    });

    it('getParameters', async () => {
        var result = await app.getParameters();
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, '--stackName', 'check: having property "stackName"');
        assert.equal(result['--stackName'], stackName);
        assert.property(result, '--version', 'check: having property "stackname"');
    });

});

