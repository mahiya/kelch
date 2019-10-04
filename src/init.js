exports.run = async () => {
    require('./create-resource').run('sample');
    require('./create-config').run();
}