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

});

