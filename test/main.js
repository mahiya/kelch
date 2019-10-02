const chai = require('chai');
const assert = chai.assert;

describe('main.js', function () {

    var app = require('../main');

    it('getParameters', async () => {
        process.argv = ['node', 'kelch', 'deploy', '--stackName', 'sample-stack', '--version'];
        var result = await app.getParameters();
        assert.typeOf(result, 'object', 'check: type of result');
        assert.property(result, '--stackName', 'check: having property "stackname"');
        assert.equal(result['--stackName'], 'sample-stack');
        assert.property(result, '--version', 'check: having property "stackname"');
    });

    it('checkParameterIsExists - Exists', async () => {
        process.argv = ['node', 'kelch', 'deploy', '--version'];
        var result = await app.checkParameterIsExists('--version');
        assert.equal(result, true);
    });

    it('checkParameterIsExists - NotExists', async () => {
        process.argv = ['node', 'kelch', 'deploy', '--version'];
        var result = await app.checkParameterIsExists('--help');
        assert.equal(result, false);
    });

});

