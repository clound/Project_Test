/**
 * Created by jky on 15-9-19.
 */
/**
 * Created by jky on 15-9-16.
 */
module.exports = function ( app ) {
    //app.get('/sign_up', function(req, res) {
    //    res.render('index');
    //});
    app.post('/getFriends', function (req, res) {
        var friendsModel = global.dbHelper.getModel('userFriends'),
            userName = req.body.uname;
        friendsModel.findOne({userName: userName}, function (err, doc) {
            if(err) {
                console.log("routes/getFriends err:" + err);
                req.session.error = '网络异常错误！';
                res.send(500,req.session.error);
                return;
            }
            if(doc) {
                var friends = [];
                var len = doc.friends.length
                for(var i = 0; i < len; i++) {
                    friends.push(doc.friends[i].name);
                }
                console.log("getFriends:" + friends);
                req.session.friends = friends;
                res.send(200, req.session.friends);
            }
        })
    });
}