/**
 * Created by jky on 15-9-17.
 */
module.exports = function ( app ) {
    app.get('/logout', function (req,res) {
        var userModel = global.dbHelper.getModel('user');
        if(req.query.uname) {
            var userName = req.query.uname;
            userModel.findOne({name: userName}, function (error, doc) {
                if (error) {
                    res.send(500);
                    console.log(error);
                } else if (!doc) {
                    req.session.error = '用户名不存在！';
                    console.log("没人了!");
                    res.send(404, req.session.error);
                } else {
                    global.dbHelper.updateUserState(doc.name, false);
                    global.dbHelper.removeSessionId(req.session.id);
                }
            });
            req.session.user = null;
            req.session.error = null;
            req.session.login = false;
        }
        res.redirect('/login');

    });
}