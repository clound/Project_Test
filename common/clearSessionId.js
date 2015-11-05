/**
 * Created by jky on 15-9-24.
 */

    /*  清除服务器垃圾数据   */

var DBHelper = require('./dbHelper');
var mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/test1");

var userModel = DBHelper.getModel('user');
var sessionModel = DBHelper.getModel('session');

deleteSessions();

return;
// check all user state
function deleteSessions() {
    userModel.find(function (err, doc) {
        if (err) {
            console.log("clearSessionId userModel err:" + err);
            return;
        }
        if(doc) {
            for (var m in doc) {
                if (doc[m].state === false) {
                    deleteOneSession(doc[m].name);
                }
                else {
                    return;
                }
            }
        }
    });
    return;
}
// delete sessionId-userName table
function deleteOneSession(userName) {
    sessionModel.find(function (err, doc) {
        if (err) {
            console.log("clearSessionId sessionModel err:" + err);
            return;
        }
        if(!doc) {
            return;
        }
        for (var m in doc) {
            if(doc[m].userName === userName) {
                DBHelper.removeSessionId(doc[m].sessionId);
                return;
            }
        }
    });
    return;
};
