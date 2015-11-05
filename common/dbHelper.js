var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    models = require('./models'),
    async = require('async');

var util = require('util');

for (var m in models) {
    console.log("m in models:" + m);
    mongoose.model(m, new Schema(models[m]));
};


/*****  注册用户   ***/
var _addUser = function (userInfo) {
    var userModel = _getModel('user');
    userModel.findOne({name: userInfo.name}, function (err, doc) {
        if (err) {
            return;
        }
        if (doc) {
            console.log('the user is exist!');
            return;
        }
    });

    var newUsers = new userModel({
        name: userInfo.name,
        password: userInfo.password,
        state: false
    });

    console.log("_addUser over");
    newUsers.save(function(err, doc){
        if (err) {
            console.log("_addUser err:" + err);
        } else {
            console.log("_addUser success:" + doc);
        }
    } );
};

/*******   检测用户是否存在 ****/
var _findUser = function (userName) {
    var userModel = _getModel("user");
    userModel.findOne({name: userName}, 'name', function (err, doc) {
        if (err) {
            return false;
        }
        if (!doc) {
            console.log("_findUser : no user");
            return false;
        } else return true;
    });
    console.log("_findUser over");
};

//  修改用户state状态，即修改在线状态
var _updateUserState = function(userName, state) {
    if(!userName) {
        return;
    }
    var userModel = _getModel('user');
    userModel.update({name: userName }, {state: state}, function (err, raw) {
       if (err) {
           console.log("_updateUserState err");
           return;
       } else if(raw) {
           console.log("_updateUserState:" + userName + " " + state);
       }
    });
};

//  获取用户state状态，即获取用户在线状态
function _getUserState(userName, callback) {
    var userModel = _getModel('user');
    userModel.findOne({name: userName}, function(err, doc) {
        if (err) {
            return;
        }
        if (doc && callback) {
            callback(doc.state);
        }
    });
}

/**********    session Model 增加记录 *******/
var _addSessionId = function (sessionId, userName) {
    var sessionModel = _getModel('session');
    sessionModel.findOne({sessionId: sessionId}, function (err, doc) {
        if (err) {
            return false;
        } else if (!doc) {
            var newSession = new sessionModel({
                sessionId: sessionId,
                userName: userName
            });
            newSession.save(function(err, doc){
                if (err) {
                    console.log("_addSessionId err:" + err);
                } else {
                    console.log("_addSessionId success:" + doc);
                }
            });
            return true;
        } else
            return false;
    })
};

/**********    session Model 删除记录 *******/
var _removeSessionId = function (sessionId) {
    var sessionModel = _getModel('session');
    console.log(sessionId);

    sessionModel.remove({sessionId: sessionId}, function (err) {
        if (err) {
            return handleError(err);
        }
    });
};

/***********   session Model ******/
var _getUnameFromSessionId = function (sessionId) {
    var sessionModel = _getModel('session');
    sessionModel.findOne({sessionId: sessionId}, "sessionId userName", function (err, doc) {
        if (err) {
            return handleError(err);
            console.log("_getUnameFromSessionId:" + err);
        } else if (doc) {
            return doc.userName;
        } else {
            return false;
        }
    });
};

/*******************************    好友添加的代码    *************************************************/

/********  createFriend in userFriends Model ****/
function _createFriendRec (userName) {
    var friendsModel = _getModel('userFriends');
    friendsModel.findOne({userName: userName}, function (err, doc) {
        if(err) {
            console.log("create userFriends err" + err);
            return;
        }
        if(!doc) {
            var newFriends = new friendsModel({
                userName: userName,
                friends: []
            });
            newFriends.save(function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("_createFriendRec" + doc);
                }
            });
        } else return;
    });

};

/*********  addFriends to Rec ****/
/*function _addFriends (userName) {
    var user = []; //数组用来保存所有的用户名
    var userModel = _getModel('user');
    userModel.find(function(err, doc) {
        if (err) {
            console.log("_addFriends err");
            return;
        } else {
            for(var id in doc) {
                var curName = doc[id].name;
                if(curName != userName){
                    user.push(curName);
                    _addFriend(userName, curName);
                    _addFriend(curName, userName);
                }
                console.log("get user:" + user);
            }
        }
    });
};*/

/**********  _add Friend ***/
function _addFriend (userName, friendsName) {
    var friendsModel = _getModel('userFriends');
    friendsModel.findOne({userName: userName}, function (err, doc) {
        if (err) {
            console.log("_addFriend err" + err);
            return;
        } else {
            for (var m in doc.friends) {
                if (doc.friends[m].name === friendsName)
                    return;         //一旦发现好友中已经有这个人，就退出，
            }
            var friend = {
                name: friendsName,
                state: false,
                Group: "default"
            };
            if(!doc || !doc.friends)
            {
                _createFriendRec(userName);
            }
            doc.friends.push(friend);
            doc.markModified('friends'); /*模型改变*/
            doc.save();
        }
    });
};
    /*删除好友*/
function _deleteFriend(userName, friendName, callback) {
    var friendsModel = _getModel('userFriends');
    friendsModel.findOne({userName: userName}, function (err, doc) {
        if(err) {
            console.log("_addFriend err" + err);
            return;
        }
        if(!doc) {
            return;
        }
        var length = doc.friends.length;
        var indexOfEle = -1;
        for(var i = 0; i < length; i++) {
            if(doc.friends[i].name === friendName) {
                indexOfEle = i;
                doc.friends.splice(indexOfEle, 1);
                length = doc.friends.length;
                i--;
            }
        }
        doc.save(function (err, doc) {
            if(err) {
                return;
            }
            if(callback && doc) {
                callback();
            }
        });
    });
}

 /**** 增加一条好友添加的记录，并写入记录  一些初始状态 如result=2表示是初始状态，并没有进行任何回复****/
function _handleAddUserRec(subject, object) {
    var addUserModel = _getModel('addUser');
    addUserModel.find(function (err, doc) {
        if (err) {
            console.log("handleAddUser err:" + err);
            return;
        }
        if( ! doc ) {
            return;
        } else {
            var FLAG_add = false;
            var FLAG_update = false;
            for( var m in doc) {
                if (doc[m].subject === subject && doc[m].object === object) {
                    FLAG_add = true;
                    if(doc[m].result === 0) { //如果这个好友的申请请求 是被object拒绝的，那么就可以更新该条记录的状态为初始状态，表示再次请求添加
                        FLAG_update = true;
                    }
                }
            }
            if(FLAG_add && FLAG_update) {
                _initAddUserRec(subject, object);
            }

            if (!FLAG_add && !FLAG_update) { //不存在这个好友请求，那么就在数据库创建记录
                _createAddUserRec(subject, object);
            }
            return;
        }
    });
};

// 创建add user record
function _createAddUserRec(subject, object) {
    var addUserModel = _getModel('addUser');
    var newAddUser = new addUserModel({
        date: new Date,
        subject: subject,
        object: object,
        result: 2,
        refuse: false
    });
    newAddUser.save(function (err, doc) {
        if(err) {
            console.log("newAddUser err:" + err);
            return;
        }
        console.log("newAddUser.save:" + doc);
    });
}

// 初始化AddUserRec为初始状态
function _initAddUserRec(subject, object) {
    var addUserModel = _getModel('addUser');
    addUserModel.find(function (err, doc) {
        if (err) {
            console.log("initAddUser err:" + err);
            return;
        }
        if( ! doc ) {
            return;
        } else {
            for( var m in doc) {
                if (doc[m].subject === subject && doc[m].object === object) {
                    doc[m].date = new Date;
                    doc[m].result = 2;
                    doc[m].refuse = false;
                    doc[m].save();
                }
            }
        }
    });
}

// 设置AddUserRec refuse 为true， 用来给subject推送object拒绝加为好友的回复
function _setAddUserRecRefuse(subject, object, refuse) {
    var addUserModel = _getModel('addUser');
    addUserModel.find(function (err, doc) {
        if (err) {
            console.log("setAddUserRecRefuse err:" + err);
            return;
        }
        if( ! doc ) {
            return;
        } else {
            for( var m in doc) {
                if (doc[m].subject === subject && doc[m].object === object) {
                    doc[m].refuse = refuse;
                    doc[m].save();
                }
            }
        }
    });
}

 /************   更新好友添加记录的状态  同意加为好友，还是不同意加为好友*/
function _updateAddUserRec(subject, object, result) {
     var addUserModel = _getModel('addUser');
     addUserModel.find(function (err, doc) {
         if (err) {
             console.log("updateAddUserRec err:" + err);
             return;
         }
         console.log(subject + "  " + object);
         if( ! doc ) {
             return;
         } else {
             for( var m in doc) {
                 if (doc[m].subject === subject && doc[m].object === object) {
                     doc[m].result = result;
                     doc[m].save();
                 }
             }
         }
     });
};

/************************************   服务器聊天room房间处理   *********************************************/
function _createRoomsRec(owner) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({ owner: owner }, function (err, doc) {
        if(err) {
            console.log("roomModel find err:" + err);
            return;
        }
        if(!doc) {
            var newRoomRecord = new roomTablesModel({
                owner: owner,
                rooms: [],
                sessions: []
            });
            newRoomRecord.save(function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("create room record" + doc);
                }
            });
        } else return;
    })

};
//创建新的房间记录
function _createRoom(owner, channel, sessionId, callback) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({owner: owner}, function (err, doc) {
        if (err) {
            console.log("_createRoom err:" + err);
            return;
        }
        if (!doc) {
            return;
        } else {
            for (var m in doc.rooms) {
                if (doc.rooms[m].sessionId === sessionId) {
                    console.log("The room " + sessionId + " is exist!");
                    if(callback)
                        callback(err, false);
                    return;
                }
            }
            console.log("add a room:" + sessionId);
            var room = {
                channel: channel,
                sessionId: sessionId,
                name: "default"
            };
            doc.rooms.push(room);
            /*模型改变*/
            doc.markModified('rooms');
            doc.save(function (err, ret) {
                if(err) {
                    return;
                }
                if(ret) {
                    for(var n in ret.rooms) {
                        if(ret.rooms[n].channel === channel && ret.rooms[n].sessionId === sessionId) {
                            if(callback) callback(err, true);
                            _createRoom_Users(ret.rooms[n]._id); //成功创建房间后，创建对应的用户表
                        }
                    }
                }
            });
        }
    });
}

//删除房间记录
function _deleteRoom(owner, channel, sessionId, callback){
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({owner: owner}, function (err, doc) {
        if (err) {
            console.log("_createRoom err:" + err);
            return;
        }
        if (!doc) {
            return;
        } else {
            async.forEach(doc.rooms, function (room, callback) {
                try {
                    if(room.sessionId === sessionId) {
                        console.log("The room " + room.sessionId + " will be delete!");
                        _deleteRoom_Users(room._id, function () {
                            console.log('这个会议将要被删除：' + room.sessionId);
                            return callback(null);
                        });
                    } else
                        return callback(null);
                } catch (e) {
                    console.log('err');
                }
            }, function (err) {
                var length = doc.rooms.length;
                var indexOfEle = -1;
                for (var i = 0; i < length; i++) {
                    if (doc.rooms[i].sessionId === sessionId) {
                        indexOfEle = i;
                        doc.rooms.splice(indexOfEle, 1);
                        length = doc.rooms.length;
                        i--;
                    }
                }
                doc.save(function (err, doc) {
                    if(err) {
                        return callback(err);
                    } else {
                        return callback();
                    }
                });
            });
        }
    });
}


//创建 房间记录 对应的用户表
function _createRoom_Users(roomId) {
    var room_usersModel = _getModel('room_users');
    room_usersModel.findOne({roomId: roomId}, function (err, doc) {
        if(err) {
            console.log("_createRoomusers err:" + err);
            return;
        } if (!doc) {
            var newRoom_User = new room_usersModel({
                roomId: roomId,
                user_number: 0,
                users: [],
                rootUser: []
            });
            newRoom_User.save(function (err, doc) {
                if (err) {
                    console.log("_createRoomUsers err:" + err);
                } else {
                    console.log("_createRoomUsers:" + doc);
                }
            });
        }
    });
}
//删除 房间记录 对应的用户表
function _deleteRoom_Users(roomId, callback) {
    var room_usersModel = _getModel('room_users');
    room_usersModel.remove({roomId: roomId}, function (err) {
        if(err) {
            return callback();
        } else {
            callback();
        }
    });
}

// 添加用户到房间的用户表中
function _addUserInRoom(owner, channel, sessionId, user, callback) {
    var room_usersModel = _getModel('room_users');
    _getRoomId(owner, channel, sessionId, function (roomId) {
        room_usersModel.findOne({roomId: roomId}, function (err, doc) {
            if(err) {
                console.log("room_userMdoel find err:" + err);
                return;
            }
            if(!doc) {
                console.log("room user table not exist!");
                _createRoom_Users(roomId); //成功创建房间后，创建对应的用户表
                _addUserInRoom(owner, channel, sessionId, user, callback);
            } else {
                var n = doc.users.length;
                for (var i = 0; i < n; i++) {
                    if(doc.users[i].user === user) {
                        callback(err, "user exist in room");
                        return;
                    }
                }
                var newUser = {
                    user: user,
                    state: true
                };
                doc.user_number++;
                doc.users.push(newUser);
                doc.markModified('users');
                doc.save(function (err, doc) {
                    if(err) {
                        console.log("save room user err:" + err);
                        return;
                    } if(doc) {
                        callback(err, doc);
                    }
                });
            }
        })
    });
}

//  将用户从一个用户的所有会议中去除
function _deleteUserInRooms(owner, user, callback) {
    _getRoom_Creator(owner, function (err, rooms) {
        if(err) {
            return;
        }
        if(!rooms) {
            return;
        }
        /*node.js 之for循环问题之异步执行 用async去执行*/
        async.forEachSeries(rooms, function (room, callback) {
            _deleteUserInRoom(owner, room.channel, room.sessionId, user, function () {
                console.log('delete user in room: ' + room.sessionId);
                return callback(null);
            });
        }, function (err) {
            return callback();
        });

    });
}

// 将用户从指定房间的用户表中去除
function _deleteUserInRoom(owner, channel, sessionId, user, callback) {
    var room_usersModel = _getModel('room_users');
    _getRoomId(owner, channel, sessionId, function (roomId) {
        room_usersModel.findOne({roomId: roomId}, function (err, doc) {
            if (err) {
                console.log("room_userMdoel find err:" + err);
                return;
            }
            if (!doc) {
                console.log("room user table not exist!");
                return;
            } else {
                var length = doc.users.length;
                var indexOfEle = -1;
                for (var i = 0; i < length; i++) {
                    if (doc.users[i].user === user) {
                        indexOfEle = i;
                        doc.users.splice(indexOfEle, 1);
                        doc.user_number--;
                        length = doc.users.length;
                        i--;
                    }
                }

                doc.save(function (err, doc) {
                    if (err) {
                        console.log("save room user err:" + err);
                        return;
                    }
                    if (doc && callback) {

                        //  如果这个会议中有这个用户，且已经把他成功删除了
                        if(indexOfEle === -1 && callback){
                            console.log('用户不在这个会议中 直接返回');
                            callback();
                            return;
                        }
                        else {
                            //  删除用户对应的加入会议
                            _deleteSession(owner, channel, sessionId, user, callback);
                            //  删除对他的邀请信息
                            var rout = {
                                owner: owner,
                                channel: channel,
                                sessionid: sessionId
                            };
                            _userMeeting_closeMeeting(user, rout);
                        }
                    }
                });
            }
        });
    });
}

//改变房间中所有用户的在线状态
function _updateRoomAllUserState(owner, channel, sessionId, state, callback) {
    var room_usersModel = _getModel('room_users');
    _getRoomId(owner, channel, sessionId, function (roomId) {
        room_usersModel.findOne({roomId: roomId}, function (err, doc) {
            if (err) {
                console.log("_updateRoomAllUserState err:" + err);
                callback(err, null);
                return;
            }
            if (!doc) {
                callback("no doc", null);
                return;
            } else {
                async.forEach(doc.users, function (user, callback) {
                    _updateRoomUserState(owner, channel, sessionId, user, state, function (err) {
                        return err ? callback(err) : callback();
                    });
                }, function (err) {
                    return callback();
                });
            }

        });
    });
}

//  改变房间中单个用户的在线状态
function _updateRoomUserState(owner, channel, sessionId, user, state, callback) {
    var room_usersModel = _getModel('room_users');
    _getRoomId(owner, channel, sessionId, function (roomId) {
        room_usersModel.findOne({roomId: roomId}, function (err, doc) {
            if(err) {
                console.log("_updateRoomUserState err:" + err);
                callback(err, null);
                return;
            }
            if(!doc) {
                callback("no doc", null);
                return;
            } else {
                var length = doc.users.length;
                for (var i = 0; i < length; i++) {
                    if(doc.users[i].user === user) {
                        doc.users[i].state = state;
                        break;
                    }
                }
                doc.save(function (err, doc) {
                    if(doc) {
                        callback(err, doc);
                    }
                });
                return;
            }

        });
    });
}

//  获取会议房间中的所有用户，通过callback返回
function _getRoomAllUser(owner, channel, sessionId, callback) {
    var room_usersModel = _getModel('room_users');
    _getRoomId(owner, channel, sessionId, function (roomId) {
        room_usersModel.findOne({roomId: roomId}, function (err, doc) {
            if (err) {
                console.log("_getRoomAllUser err:" + err);
                return;
            }
            if (!doc) {
                console.log('_get Room All user :  no database');
                return callback(err, null, 0);

            } else {
                var length = doc.users.length;
                if(length === 0 && callback) {
                    return callback(err, null, 0);
                }
                for (var i = 0; i < length; i++) {
                    console.log("This room get one user:" + doc.users[i].user );
                    if(callback)
                        callback(err, doc.users[i], doc.user_number);
                }
            }
        });
    });
}

//  通过前三个参数获取唯一房间的房间号，回调函数返回 roomId
function _getRoomId(owner, channel, sessionId, callback) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({owner: owner}, function (err, doc) {
        if(err) {
            console.log("_getRoomId err:" + err);
            return;
        }
        if(!doc) {
            return;
        } else {
            for(var m in doc.rooms) {
                if(doc.rooms[m].channel === channel && doc.rooms[m].sessionId === sessionId) {
                    callback(doc.rooms[m]._id);
                }
            }
        }
    });

}

// 创建会话在数据库中
function _createSession(owner, channel, sessionId, user, callback) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({owner: user}, function (err, doc) {
        if(err) {
            console.log("createSession find err:" + err);
            return;
        }
        if(!doc) {
            return;
        } else {
            for(var m in doc.sessions) {
                if(doc.sessions[m].sessionId === sessionId && doc.sessions[m].channel === channel) {
                    var msg = "数据库显示，该用户已经添加过这个会议了！不需要再添加了。";
                    callback(err, msg);
                    return;
                }
            }
            var newSession = {
                channel: channel,
                sessionId: sessionId,
                name: "default",
                theOwner: owner
            };
            doc.sessions.push(newSession);
            doc.markModified('sessions');
            doc.save(function (err, doc) {
                if(err) {
                    console.log("save new session err:" + err);
                    return;
                } else {
                    var msg = "已经将该用户加入会议的信息记录"
                    callback(err, msg);
                }
            });
        }
    });
}
//  删除会话
function _deleteSession(owner, channel, sessionId, user, callback) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({owner: user}, function (err, doc) {
        if(err) {
            console.log("delete Session find err:" + err);
            return;
        }
        if(!doc) {
            return;
        } else {
            var length = doc.sessions.length;
            var indexOfEle = -1;
            for(var i = 0; i < length; i++) {
                if(doc.sessions[i].theOwner === owner && doc.sessions[i].sessionId === sessionId) {
                    indexOfEle = i;
                    doc.sessions.splice(indexOfEle, 1);
                    length = doc.sessions.length;
                    i--;
                }
            }
            doc.save(function (err, doc) {
                if(err) {
                    console.log("_delete session err:" + err);
                    return;
                } else {
                    console.log('_delete Session success');
                    if(callback) {
                        callback();
                    }
                }
            });
        }
    });
}

// 获取房间列表(用户创建的会议)
function _getRoom_Creator (owner, callback) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({ owner: owner }, function (err, doc) {
        if(err) {
            callback(err, doc);
            return;
        } else {

            try {
                if (doc.rooms.length === 0) {
                    callback(err, null);
                    return;
                } else {
                    callback(err, doc.rooms);
                }
            } catch (e) {
                console.log("the owner is:" + owner);
            }
        }
    });
}
//  获取房间列表（用户加入的会议）
function _getRoom_Entrants (owner, callback) {
    var roomTablesModel = _getModel('roomTables');
    roomTablesModel.findOne({ owner: owner }, function (err, doc) {
        if(err) {
            return;
        }
        if(!doc) {
            return;
        }
        else {
            try {
                if (doc.sessions.length === 0) {
                    if(callback)
                        callback(err, null);
                    return;
                } else {
                    if(callback)
                        callback(err, doc.sessions);
                    return;
                }
            } catch (e) {
                console.log('doc.sessions not exist!');
                if(callback)
                    callback(err, null);
            }
        }
    });
}

//  会议房间的解散记录，用于通知用户会议的解散事件
function _create_disMissMeeting(owner, channel, sessionid, user, callback) {
    var disMissModel = _getModel('disMissMeeting');
    disMissModel.findOne({user: user}, function (err, doc) {
        if (err) {
            return callback ? callback(err) : null;
        }
        if (!doc) {
            var newDisMeeting = new disMissModel({
                user: user,
                meeting: [{
                    owner: owner,
                    channel: channel,
                    sessionId: sessionid,
                    name: 'default'
                }]
            });
            newDisMeeting.save(function (err, doc) {
                if (err) {
                    return callback ? callback(err) : null;
                }
                if (!doc) {
                    return callback ? callback(new Error('save null doc!')) : null;
                } else {
                    return callback ? callback(err) : null;
                }
            });
        } else{
            var newMeeting = {
                owner: owner,
                channel: channel,
                sessionId: sessionid,
                name: 'default'
            };
            doc.meeting.push(newMeeting);
            doc.save(function (err, doc) {
                if (err) {
                    return callback ? callback(err) : null;
                }
                if (!doc) {
                    return callback ? callback(new Error('save null doc!')) : null;
                } else {
                    return callback ? callback(err) : null;
                }
            });
        }
    });
}
//  获取会议的解散记录，通知用户
function _get_disMissMeeting(user, callback) {
    var disMissModel = _getModel('disMissMeeting');
    disMissModel.findOne({user: user}, function (err, doc) {
        if(err) {
            return callback ? callback(err) : null;
        }
        if(!doc) {
            return callback ? callback(null, null) : null;
        }
        else if(doc.meeting.length === 0) {
            return callback ? callback(null, null) : null;
        } else return callback ? callback(null, doc.meeting) : null;
    });
}
//  删除关于会议解散的通知记录，不再通知用户
function _delete_disMissMeeting(user, meeting) {
    var disMissModel = _getModel('disMissMeeting');
    disMissModel.findOne({user: user}, function (err, doc) {
        if(err) {
            return;
        }
        if(!doc) {
            return;
        } else {
            var length = doc.meeting.length;
            var indexOfEle = -1;
            for(var i = 0; i < length; i++) {
                if(doc.meeting[i].owner === meeting.owner && doc.meeting[i].sessionId === meeting.sessionId) {
                    indexOfEle = i;
                    doc.meeting.splice(indexOfEle, 1);
                    length = doc.meeting.length;
                    i--;
                }
            }
            doc.save(function (err, doc) {
                if(err || !doc) {
                    return;
                } else {
                    console.log('成功删除一条会议解散记录的提醒！')
                }
            })
        }

    });
}


/************   创建 usermeeting 数据表  *****************/
function _create_userMeetingRecord(user, callback) {
    var userMeeting = _getModel('userMeeting');
    userMeeting.findOne({user: user}, function (err, doc) {
        if (err) {
            console.log("create_userMeetingRecord err:" + err);
            return;
        }
        if (doc) {
            return;
        }
        var newUserMeeting = new userMeeting({
            user: user,
            meeting_routs: []
        });
        newUserMeeting.save(function (err, doc) {
            if(err) {
                console.log("create userMeeting Record  save err:" + err);
                return;
            }
            if(callback) {
                var msg = "成功创建用户会议表";
                callback(msg);
            }
        });
    });
}

//  会议关闭时维护数据库，删除关于邀请的那条记录
function _userMeeting_closeMeeting(user, rout, callback) {
    var userMeeting = _getModel('userMeeting');
    userMeeting.findOne({user: user}, function (err, doc) {
        if (err) {
            console.log("find err:" + err);
            return;
        }
        if(doc.meeting_routs) {
            var length = doc.meeting_routs.length;
            console.log("the meeting length :" + length);
            console.log("the user is :" + user);
            var indexOfEle = -1;
            for(var i = 0; i < length; i++) {
                console.log("i = " + i);
                if(doc.meeting_routs[i].owner === rout.owner && doc.meeting_routs[i].sessionid === rout.sessionid) {
                    indexOfEle = i;
                    doc.meeting_routs.splice(indexOfEle, 1);
                    //  下面这两行解决数据库中的重复数据问题
                    length = doc.meeting_routs.length;
                    i--;
                }
            }
            doc.save(function (err, doc) {
                if(err) {
                    return;
                }
                if(callback && doc) {
                    callback();
                }
            });

        }
    });
}

//  加入对用户的邀请信息
function _userMeeting_addInvite(user, meeting_routs, callback) {
    var userMeeting = _getModel('userMeeting');
    userMeeting.findOne({user: user}, function (err, doc) {
        if (err) {
            console.log("find err:" + err);
            return;
        }
        if(!doc) {
            return;
        }
        if (doc && doc.meeting_routs) {
            var length = doc.meeting_routs.length;
            for( var i = 0; i < length; i++) {
                if(doc.meeting_routs[i].owner === meeting_routs.owner && doc.meeting_routs[i].sessionid === meeting_routs.sessionid)
                    return;
            }
            doc.meeting_routs.push(meeting_routs);
            doc.markModified('meeting_routs'); /*模型改变*/
            doc.save(function (err, doc) {
                if(err) {
                    return;
                }
                if(doc) {
                    console.log('加入对用户的邀请信息！');
                    if(callback) {
                        callback();
                    }
                }
            });
        }
    });
}

//  获取邀请信息，用户推送给用户
function _userMeeting_getInvite(user, callback) {
    var userMeeting = _getModel('userMeeting');
    userMeeting.findOne({user: user}, function (err, doc) {
        if (err) {
            console.log("find err:" + err);
            return;
        }
        if(!doc) {
            return;
        }
        if(doc && doc.meeting_routs) {
            var length = doc.meeting_routs.length;
            if(length > 0) {
                callback(err, doc.meeting_routs);
            }
        }
    });
}


/************  返回Schema 数据库数据模型  *************/
var _getModel = function (type) {
    return mongoose.model(type);
};

module.exports = {
    getModel: function (type) {
        return _getModel(type);
    },
    addUser: function (userInfo) {
        _addUser(userInfo);
    },
    updateUserState: function (userName, state) {
        _updateUserState(userName, state);
    },
    getUserState: function (userName, callback) {
        _getUserState(userName, callback);
    },
    addSessionId: function (sessionId, userName) {
        _addSessionId(sessionId, userName);
    },
    removeSessionId: function (sessionId) {
        _removeSessionId(sessionId);
    },
    getUnameFromSessionId: function (sessionId) {
        return _getUnameFromSessionId(sessionId);
    },
    createFriendRec: function (userName) {
        _createFriendRec(userName);
    },
    addFriends: function (userName) {
        _addFriends(userName);
    },
    addFriend: function (userName, friendName) {
        _addFriend(userName, friendName);
    },
    deleteFriend: function (userName, friendName, callback) {
        _deleteFriend(userName, friendName, callback)
    },
    addUserRecord: function (subject, object) {
        _handleAddUserRec(subject, object);
    },
    updateAddUserRec: function (subject, object, result) {
        _updateAddUserRec(subject, object, result);
    },
    setRecRefuse: function (subject, object, refuse) {
        _setAddUserRecRefuse(subject, object, refuse);
    },
    createRoomsRec: function (owner) {
        _createRoomsRec(owner);
    },
    createRoom: function(owner, channel, sessionId, callback) {
        _createRoom(owner, channel, sessionId, callback);
    },
    deleteRoom: function (owner, channel, sessionId, callback) {
        _deleteRoom(owner, channel, sessionId, callback);
    },
    addUserInRoom: function(owner, channel, sessionId, user, callback){
        _addUserInRoom(owner, channel, sessionId, user, callback);
    },
    deleteUserInRooms: function(owner, user, callback) {
        _deleteUserInRooms(owner, user, callback);
    },
    deleteUserInRoom: function(owner, channel, sessionId, user, callback){
        _deleteUserInRoom(owner, channel, sessionId, user, callback)
    },
    create_disMissMeeting: function (owner, channel, sessionid, user, callback){
        _create_disMissMeeting(owner, channel, sessionid, user, callback);
    },
    get_disMissMeeting: function (user, callback) {
        _get_disMissMeeting(user, callback);
    },
    delete_disMissMeeting: function (user, meeting) {
        _delete_disMissMeeting(user, meeting);
    },
    createSessions: function (owner, channel, sessionId, user, callback) {
        _createSession(owner, channel, sessionId, user, callback);
    },
    getRoom_Creator: function(owner, callback) {
        _getRoom_Creator(owner,callback);
    },
    getRoom_Entrants: function (owner,callback) {
        _getRoom_Entrants(owner,callback);
    },
    updateRoomUserState: function(owner, channel, sessionId, user, state, callback) {
        _updateRoomUserState(owner, channel, sessionId, user, state, callback);
    },
    updateRoomAllUserState: function (owner, channel, sessionId, state, callback) {
        _updateRoomAllUserState(owner, channel, sessionId, state, callback);
    },
    // 获取会议室的所有用户，通过callback返回每个用户
    getRoomAllUser: function (owner, channel, sessionId, callback) {
        _getRoomAllUser(owner, channel, sessionId, callback);
    },
    create_userMeetingRecord: function (user, callback) {
        _create_userMeetingRecord(user, callback);
    },
    userMeeting_update: function (user, meeting_routs, callback) {
        _userMeeting_addInvite(user, meeting_routs, callback);
    },
    closeMeeting_clear: function (user, rout, callback) {
        _userMeeting_closeMeeting(user, rout, callback);
    },
    userMeeting_getInvite: function (user, callback) {
        _userMeeting_getInvite(user, callback);
    }
};
