const fs = require('fs-extra');
const path = require('path');
const spawn = require("child_process").spawn;

module.exports = class KelchCommon {

    static exec = async function (command) {
        return new Promise((resolve) => {
            var args = command.split(' ');
            if (args.length == 0) {
                return resolve();
            }

            console.log('Execute command: %s', command);
            var outputs = [];
            var process = spawn(args[0], args.slice(1, args.length));
            process.stdout.on("data", (data) => {
                var output = data.toString();
                console.log(output);
                outputs.push(output);
            });
            process.on("close", (code) => {
                resolve({
                    success: code == 0,
                    outputs: outputs
                });
            });
        });
    }

    static getRegion(profileName = 'default') {
        const userDirPath = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
        var text = fs.readFileSync(path.join(userDirPath, '.aws', 'config'), { encoding: 'utf-8' });
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i] == '[' + profileName + ']' && i + 1 < lines.length) {
                return lines[i + 1].replace(/ /g, '').replace('region=', '');
            }
        }
        return null;
    }

    // コマンドを実行したディレクトリの名前を返す
    static getCurrentDirName() {
        return path.basename(process.cwd());
    }

}
