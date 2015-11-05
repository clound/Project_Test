module.exports = function ( app ) {
    app.get('/login',function(req,res){
        res.render('index');
    });

    app.post('/login', function (req, res) {
        var User = global.dbHelper.getModel('user')
            uname = req.body.uname;
        User.findOne({name: uname}, function (error, doc) {
            if (error) {
                res.send(500);
                console.log(error);
            } else if (!doc) { 
                var err = '用户名不存在！';
                res.send(404, err);
            } else {
               if(req.body.upwd != doc.password){
                   var err = "密码错误!";
                   res.send(404,err);
               }else{
                   global.dbHelper.createFriendRec(doc.name);
                   global.dbHelper.createRoomsRec(doc.name);
                   global.dbHelper.create_userMeetingRecord(doc.name);
                   global.dbHelper.updateUserState(doc.name, true);
                   global.dbHelper.addSessionId(req.session.id, doc.name);
                   req.session.user=doc.name;
                   req.session.login = true;
                   res.send(200);
               }
            }
        });
    });
}