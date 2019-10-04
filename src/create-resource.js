const fs = require('fs-extra');
const path = require('path');

exports.run = async function (name) {
    const templateCodePath = path.join(__dirname, 'create-resource-template.js');
    var templateCode = await fs.readFile(templateCodePath, { encoding: 'utf-8' });
    await fs.writeFile(name + '.js', templateCode);
}