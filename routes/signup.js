/**
 * Created by jky on 15-9-16.
 */
module.exports = function ( app ) {
    //app.get('/sign_up', function(req, res) {
    //    res.render('index');
    //});
    var util = require('util');
    var async = require('async');
    app.post('/sign_up', function (req, res) {
        var userModel = global.dbHelper.getModel('user'),
            userInfo = ({
                name: req.body.uname,
                password: req.body.upwd,
                state: false
            });
        userModel.findOne({name: userInfo.name}, function (error, doc) {
            console.log(doc);
            if (error) {
                req.session.error = '网络异常错误！';
                res.send(500,req.session.error);
                console.log(error);
            } else if (doc) {
                req.session.error = '用户名已存在！';
                res.send(500,req.session.error);
            } else {
                global.dbHelper.addUser(userInfo);
                global.dbHelper.createFriendRec(userInfo.name);
                global.dbHelper.createRoomsRec(userInfo.name);
                global.dbHelper.create_userMeetingRecord(userInfo.name);

                //global.dbHelper.addFriends(userInfo.name);
                setImmediate(function (cb) {
                    userModel.findOne({name: userInfo.name}, function (err, doc) {
                        if(err) {
                            res.send(500, req.session.error);
                            req.session.error = '用户注册失败';
                        } else if(doc) {
                            req.session.success = '注册成功';
                            res.send(200, req.session.success);
                            console.log("注册成功了!")
                        }
                    });
                });
            }
        });
    });
}