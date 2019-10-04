module.exports = class KelchInit {

    constructor() {

    }

    async init() {
        require('./create-resource').run('sample');
        require('./create-config').run();
    }

}
