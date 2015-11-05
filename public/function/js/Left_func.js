/**
 * Created by lenovo on 15-9-24.
 */
angular.module('left_func',['ui.bootstrap'])
    //好友列表
    .controller('friendlist', ['$scope','$http',function ($scope,$http) {
        $scope.oneAtATime = true;
        $scope.group = {
            title : '当前用户',
            content : 'content'
        };
        $scope.items = [];
        $scope.status = {
            //isFirstOpen: true,
        }
        $http({
            url:'/getUserName',
            method:'POST',
        }).success(function(data, status, headers, config) {
            if(status === 200){
                $scope.group.content = data;
                globalclientUser = data;
                getfriedname(data);
            }
            if(status === 204) {
                document.getElementById('logout1').click();
            }
        }).error(function (data, status, headers, config) {
            alert("err");
        });
        getfriedname = function(username){
            if(!username) {
                return;
            }
            var data = {"uname":username};
            $http({
                url:'/getFriends',
                method:'POST',
                data:data,
            }).success(function(data, status, headers, config) {
                $scope.items = [];
                if(status == '200'){
                    signaler.socket.emit('getFriends', data);
                }
            }).error(function (data, status, headers, config) {
                if(status == "404"){

                }
            });
        };
        signaler.socket.on('get_friend_state', function (userFriends) {
            $scope.$apply(function () {
                $scope.items = userFriends;
                $scope.items.forEach(function(item,index) {
                    $scope.items[index].currentstate=item.state;
                    if (item.state) {
                        item.state = '在线';
                    }
                    else{
                        item.state = '离线';

                    }
                });
            });
        });
    }])
    //群列表
    .controller('grouplist', ['$scope','$http',function ($scope,$http) {
        $scope.oneAtATime = true;
        $scope.items = [];
        //获取用户自己创建的房间
        signaler.socket.on('get_rooms_message', function (rooms_msg) {
            $scope.$apply(function () {
                if (!rooms_msg) {
                    $scope.items = [];
                    return;
                }
                $scope.lists = rooms_msg;
                $scope.lists.forEach(function (list) {
                    if (list.roomName == 'default') {
                        list.roomName = list.sessionId;
                    }
                    list.roomUsers.forEach(function (item,index) {
                        list.roomUsers[index].currentstate=item.state;
                        if (item.state) {
                            item.state = '已加入';
                        }
                        else {
                            item.state = '未加入';
                        }
                    });
                });
            });
        });
    }])
    //所属群列表
    .controller('affiliation', ['$scope','$http',function ($scope,$http) {
        $scope.oneAtATime = true;
        $scope.items = [];
        //获取用户加入的房间
        signaler.socket.on('get_sessions_message', function (session_msg) {
            $scope.$apply(function () {
                if(!session_msg) {
                    $scope.items = [];
                    return;
                }
                $scope.items = session_msg;
                $scope.items.forEach(function(list) {
                    console.log('list:' + list);
                    if (list.roomName == 'default') {
                        list.state = '不可加入';
                        list.roomName = list.sessionId;
                    }
                });
            })

        });
    }])
    //分享文件的控制器
    .controller('Share_file', function ($scope) {
        connection.body = document.getElementById('file_area');
        $scope.addItem = function(){
            var fileSelector = new FileSelector();
            fileSelector.selectSingleFile(function(file) {
                connection.send(file);
            });
        }
    })
    //添加网络好友
    .controller('Add_newfriend', function ($scope) {
        $scope.addFriend = function () {
            var FriendName = $scope.FriendName.replace(/^\s+|\s+$/g, '');
            if(globalclientUser === FriendName){
                    alert("不能添加自己哦！");
                    return;
                }
            // 发送添加好友的信号   第一个参数是主体，第二个参数是客体
            signaler.socket.emit('addFriendReq_1', globalclientUser, FriendName);
        }
    })
    //右键菜单的控制器(friends)
    .controller('FriendController', ['$scope',
        function ($scope) {
            $scope.menuOptions = [
                ['解除好友关系', function ($itemScope) {
                    if(!confirm("您要与该用户解除好友关系，请确认！")) {
                        return;
                    }
                    var friendName = $itemScope.item.name;
                    signaler.socket.emit('delete_friend', globalclientUser, friendName, function () {
                        alert('已经讲用户' + friendName + '从好友列表中清除！');
                    });
                }],
                null,
                ['邀请加入会议', function ($itemScope) {
                    var friendName = $itemScope.item.name;
                    emitInviteSig(friendName);
                }]
            ];
        }
    ])
    //右键菜单的控制器(groups)
    .controller('GroupController', ['$scope',
        function ($scope) {
           // console.log($scope.list.roomName);
            $scope.menuOptions = [
                ['启动会议', function ($itemScope) {
                    return !FlagOnMeeting ? OpenAMeeting($scope.list.sessionId) : null;
                }],
                null,
                ['一键邀请', function () {
                    if(!FlagOnMeeting)
                        return alert('请先启动会议！');
                    signaler.socket.emit('check-activeMeeting-toServer', {
                        channel: $scope.list.channel,
                        sessionId: $scope.list.sessionId
                    }, function (state, sessionId) {
                        return state ? document.getElementById('invite_all').click() : alert('活动会议是' + sessionId);
                    });
                }
                ],
                null,
                ['关闭会议', function () {
                    if(!FlagOnMeeting)
                        return alert('请先启动会议！');
                    signaler.socket.emit('check-activeMeeting-toServer', {
                        channel: $scope.list.channel,
                        sessionId: $scope.list.sessionId
                    }, function (state, sessionId) {
                        console.log('state: ' + state);
                        return state ? document.getElementById('close').click() : alert('关错了！活动会议是' + sessionId);
                    });
                }],
                null,
                ['解散会议', function ($itemScope) {
                    if(!confirm("您要解散这个会议，会议解散后将不存在。请确认！")) {
                        return;
                    }
                    signaler.socket.emit('dismiss_meeting', globalclientUser, $scope.list.channel, $scope.list.sessionId, function () {
                        alert('会议已经成功解散，并通知其他用户');
                    });
                }],
                null,   null,
                ['将该用户踢出会议', function ($itemScope) {
                    var friend = $itemScope.item.user;
                    connection.eject(friend);
                    var ejectInfo = {
                        owner: globalclientUser,
                        channel: connection.channel,
                        sessionid: connection.sessionid,
                        friend: friend
                    };
                    signaler.socket.emit('eject_user', ejectInfo, function () {
                        alert('踢出用户' + friend + "成功！");
                    });
                }],
                null,
                ['将该用户从房间中删除', function ($itemScope) {
                    if(!confirm("您要把该用户从这个会议组删除，请确认！")) {
                        return;
                    }
                    var friend = $itemScope.item.user;
                    signaler.socket.emit('delete_userInThisRoom', globalclientUser, $scope.list.channel, $scope.list.sessionId, friend, function () {
                        alert('已从该会议中永久删除！');
                    });

                }]
            ];
        }
    ])
    //右键菜单的控制器(Belong_groups)
    .controller('BelongController', ['$scope',
        function ($scope) {
            var val_meetings = {};
            $scope.item.ing_state = false;
     /*       $scope.item.could_state = false;
            $scope.item.not_state = false;*/
            signaler.socket.on('push_meeting_invite', function (meetings) {
                $scope.$apply(function () {
                    var keepGoing = true;
                    var meeting_name = $scope.item.roomName;
                    $scope.items = meetings;
                    $scope.items.forEach(function(item) {
                        if(keepGoing){
                            if (item.sessionid === meeting_name) {
                                val_meetings[meeting_name] = item;
                                if(globalRoomSession === item.sessionid){
                                    $scope.item.state = '会议中';
                                    $scope.item.ing_state = true;
                                }
                                else{
                                    $scope.item.state = '可加入';
                                    $scope.item.could_state = true;
                                }
                                keepGoing = false;
                            }
                            else{
                                $scope.item.state = '不可加入';
                            }
                        }
                    });
                });
            });
            $scope.menuOptions = [
                ['加入该会议', function ($itemScope) {
                    var index = $itemScope.$index;
                    var nameIndex = $itemScope.item.roomName;
                    var roomInfo = {
                        channel: val_meetings[nameIndex].channel,
                        sessionid: val_meetings[nameIndex].sessionid,
                        owner: val_meetings[nameIndex].owner,
                        friend: globalclientUser
                    };
                    signaler.joinAMeeting(roomInfo);
                }],
                null,
                ['退出该会议', function ($itemScope) {
                    if(!FlagOnMeeting)
                        return alert('没有会议需要退出！');
                    signaler.socket.emit('check-JoinedMeeting-toServer', {
                        sessionId: $itemScope.item.sessionId,
                        owner: $itemScope.item.theOwner
                    }, function (state, sessionId) {
                        return state ? document.getElementById('out_room').click() : alert('活动会议是' + sessionId);
                    });
                }]
            ];
        }
    ])
    // 右键菜单的指令
    .directive('contextMenu', function ($parse) {
        var renderContextMenu = function ($scope, event, options) {
            if (!$) { var $ = angular.element; }
            $(event.currentTarget).addClass('context');
            var $contextMenu = $('<div>');
            $contextMenu.addClass('dropdown clearfix');
            var $ul = $('<ul>');
            $ul.addClass('dropdown-menu');
            $ul.attr({ 'role': 'menu' });
            $ul.css({
                display: 'block',
                position: 'absolute',
                left: event.pageX + 'px',
                top: event.pageY + 'px'
            });
            angular.forEach(options, function (item, i) {
                var $li = $('<li>');
                if (item === null) {
                    $li.addClass('divider');
                } else {
                    $a = $('<a>');
                    $a.attr({ tabindex: '-1', href: '#' });
                    $a.text(typeof item[0] == 'string' ? item[0] : item[0].call($scope, $scope));
                    $li.append($a);
                    $li.on('click', function ($event) {
                        $event.preventDefault();
                        $scope.$apply(function () {
                            $(event.currentTarget).removeClass('context');
                            $contextMenu.remove();
                            item[1].call($scope, $scope);
                        });
                    });
                }
                $ul.append($li);
            });
            $contextMenu.append($ul);
            var height = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            $contextMenu.css({
                width: '100%',
                height: height + 'px',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 9999
            });
            $(document).find('body').append($contextMenu);
            $contextMenu.on("mousedown", function (e) {
                if ($(e.target).hasClass('dropdown')) {
                    $(event.currentTarget).removeClass('context');
                    $contextMenu.remove();
                }
            }).on('contextmenu', function (event) {
                $(event.currentTarget).removeClass('context');
                event.preventDefault();
                $contextMenu.remove();
            });
        };
        return function ($scope, element, attrs) {
            element.on('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    var options = $scope.$eval(attrs.contextMenu);
                    if (options instanceof Array) {
                        renderContextMenu($scope, event, options);
                    } else {
                        throw '"' + attrs.contextMenu + '" not an array';
                    }
                });
            });
        };
    });
