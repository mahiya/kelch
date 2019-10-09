const chai = require('chai');
const fs = require('fs-extra');
const path = require('path');
const assert = chai.assert;

describe('integration', function () {

    const Kelch = require('../src/kelch.js');
    const workingDirPath = path.join('.', 'integration-test', '.work');
    const stackName = 'kelch-integration-test';
    const s3BucketName = 'kelchintegrationtest';

    before(async () => {
        await fs.remove(workingDirPath);
        await fs.mkdir(workingDirPath);
    });

    after(async () => {
        await fs.remove(workingDirPath);
    });

    it('senario', async () => {
        await new Kelch(['node', 'kelch', '--version']).run();
        await new Kelch(['node', 'kelch', '--help']).run();
        await new Kelch(['node', 'kelch', 'init']).run();
        await new Kelch(['node', 'kelch', 'create-resource', '--name', 'sample2']).run();
        await new Kelch(['node', 'kelch', 'create-config']).run();
        await new Kelch(['node', 'kelch', 'deploy', '--stack-name', stackName, '--s3-bucket', s3BucketName]).run();
        await new Kelch(['node', 'kelch', 'delete', '--stack-name', stackName]).run();
    });

});

