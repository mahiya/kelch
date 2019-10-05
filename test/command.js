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
    before(async () => {
        await fs.remove(workingDirPath);
        await fs.mkdir(workingDirPath);
    });

    after(async () => {
        await fs.remove(workingDirPath);
    });

    it('init', async () => {
    });

    it('createResource', async () => {
        const resourceName = 'create-resource-test';
        await command.createResource(resourceName, workingDirPath);
        assert.equal(fs.existsSync(path.join(workingDirPath, resourceName + '.js')), true, 'check: created resource file is exists');
    });

    it('createConfig', async () => {

    });

    it('updateConfig', async () => {
    });

    it('deleteStack', async () => {
    });

});

