module.exports = function ( app ) {
    require('./login')(app);
    require('./home')(app);
    require('./signup')(app);
    require('./logout')(app);
    require('./getUserName')(app);
    require('./getFriends')(app);
};