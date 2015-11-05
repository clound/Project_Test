
module.exports = {
    //  用户注册信息
    user: {
        name: { type: String, required: true },
        password: { type: String, required: true },
        state: { type: Boolean, required: true }
    },
    //  服务器-客户端会话信息
    session: {
        sessionId: { type: String, required: true },
        userName: { type: String, required: true }
    },
    //  用户好友信息
    userFriends: {
        userName: { type: String, required: true },
        friends: [
            {
                name: { type: String, required: true },
                Group: { type: String, required: true }
            }
        ]
    },
    //  好友添加的申请/回复记录
    addUser: {
        date: { type: Date },
        subject: { type: String, required: true },
        object: { type: String, required: true },
      //  response: { type: Boolean, required: true },      /***** response false/true object是否回复*/
        result: { type: Number, required: true },           /***** result  0——不同意  1——同意  2——默认且没有回复过 */
        refuse: {type: Boolean, required: true}             /***** refuse  在用户同意好友和默认初始化状态时， refuse-false
                                                                            如果不同意好友， refuse-true
                                                                用来推送给subject客户端， object对于此次请求的拒绝状态*/
    },
    //  用户创建的会议信息
    roomTables: {
        owner: { type: String, required: true },                    //房间信息
        rooms: [                                                    /******rooms 存储所有owner创建的房间*/
            {
                channel: {type: String, required: true},            //channel
                sessionId: { type: String, required: true },        //房间sessionId   房间入口地址
                name: { type: String, required: false }            //房间别名
            }
        ],
        sessions: [                                                  /******sessions 存储加入的别人的房间***/
            {
                channel: {type: String, required: true},
                sessionId: { type: String, required: true },        //房间的sessionId  房间入口地址
                name: { type: String, required: false },            //房间的别名
                theOwner: { type: String, required: true }         //房间的创建人
            }
        ]
    },
    //  会议房间的用户列表
    room_users: {
        roomId: { type: String , required: true},
        user_number: { type: Number, required: true},
        users: [                                                    //房间内的邀请加入的所有的用户列表
            {
                user: { type: String },
                state: { type: Boolean, required: true}
            }
        ],

        rootUser: [                                                 //拥有特权的user 比如说 主讲人之类的
            {
                user: { type: String }
            }
        ]
    },
    //  会议对用户的链接邀请信息，用户推送邀请服务
    userMeeting: {                                                   //推送会议邀请服务（前提是用户已经在这个会议中了）
        user: { type: String, required: true},
        meeting_routs: [{
            owner: { type: String, required: true},
            channel: { type: String, required: true},
            sessionid: { type: String, required: true},
        }]
    },
    //  会议房间的的解散记录 用于对用户推送通知
    disMissMeeting: {
        user: { type: String, required: true },
        meeting: [{
            owner: {type: String, required: true},
            channel: {type: String, required: true},            //channel
            sessionId: { type: String, required: true },        //房间sessionId   房间入口地址
            name: { type: String, required: false }            //房间别名
        }]
    }
};
