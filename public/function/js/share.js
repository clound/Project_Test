// initializing RTCMultiConnection constructor.
var connection = new RTCMultiConnection();
//定义全局变量  客户端userName
globalclientUser = '';
FlagOnMeeting = false;
globalRoomSession = '';
// using reliable-signaler
var signaler = initReliableSignaler(connection, '/');

connection.session = {
    audio: true,
    video: true,
    data: true
};
connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};
var videoConstraints = {
    mandatory: {
        maxWidth: 1920,
        maxHeight: 1080,
        minAspectRatio: 1.77,
        minFrameRate: 3,
        maxFrameRate: 64
    },
    optional: []
};
var audioConstraints = {
    mandatory: {
        // echoCancellation: false,
        // googEchoCancellation: false, // disabling audio processing
        // googAutoGainControl: true,
        // googNoiseSuppression: true,
        // googHighpassFilter: true,
        // googTypingNoiseDetection: true,
        // googAudioMirroring: true
    },
    optional: []
};
connection.mediaConstraints = {
    video: videoConstraints,
    audio: audioConstraints
};
disableFuncButton();

/*加入现有进入会议人员的视频*/
var videoContainer = document.querySelector('.video');
connection.onstream = function(e) {
    var div = document.createElement('label');
    var textnode=document.createTextNode(e.userid);
    div.appendChild(textnode)
    videoContainer.appendChild(e.mediaElement);
    e.mediaElement.parentNode.insertAfter(div,e.mediaElement);
};

document.getElementById('open').onclick = function() {
    if(FlagOnMeeting) {
        alert('已经在一个会议室，不能开启其他会议！');
        return;
    }
    var sessionid = document.getElementById('session-id').value;
    if (sessionid.replace(/^\s+|\s+$/g, '').length <= 0) {
        alert('请输入一个房间名/房间号');
        document.getElementById('session-id').focus();
        return;
    }
    //将用户输入的sessionid加一个用户名前缀，由于用户名是唯一的，所以该房间号也是唯一的。
    sessionid = globalclientUser + "_" +sessionid;
    alert("创建房间：" + sessionid);
    OpenAMeeting(sessionid);

};

function OpenAMeeting(sessionid) {
    connection.channel = connection.userid = globalclientUser;
    connection.sessionid = sessionid;

    //  房间属主和sessionId
    var roomInfo = {
        owner: globalclientUser,
        channel: connection.channel,
        sessionid: connection.sessionid
    };

    this.disabled = true;
    enableFuncButton();

    connection.open({
        onMediaCaptured: function() {
            FlagOnMeeting = true;
            signaler.createNewRoomOnServer(connection.sessionid);
            signaler.socket.emit("createRoom", roomInfo);
        }
    });

}
//将文件的URL传给showpdfcanvas，将pdf文件显示出来
var putURL = function(fileurl){
    showpdfcanvas(fileurl);
}
//上传文件按钮的点击事件
document.getElementById('post-file').onclick = function(){
    if(connection.isInitiator) {
        var file_post = new FileSelector();
        file_post.selectSingleFile(function (file) {
            connection.send(file);
        });
    }
};
connection.onopen = function() {
    document.getElementById('share-file').disabled = false;
    document.getElementById('post-file').disabled = false;
    document.getElementById('input-text-chat').disabled = false;
    document.getElementById('share-part-of-screen').disabled = false;
    document.getElementById('prevpage').disabled = false;
    document.getElementById('nextpage').disabled = false;
};
//分享屏幕的点击事件
document.getElementById('share-part-of-screen').onclick = function() {
    connection.resumePartOfScreenSharing();
    if(connection.isInitiator) {
        this.disabled = true;
        connection.sharePartOfScreen({
            element: "#canvas",
            interval:400
        });
    }else{
        connection.send({
            data:"myshare",
            userid:connection.userid,
            isMessage:true
        });
        connection.sharePartOfScreen({
            element: '#canvas',
            interval: 400
        });
        connection.pausePartOfScreenSharing();
    }
};
//上一页的监听点击事件
document.getElementById('prevpage').addEventListener('click', function(){
    if(connection.isInitiator){
        connection.send({
            data:"prev",
            isMessage:true
        });
        //document.getElementById('my_frame').contentWindow.onPrevPage();
        onPrevPage();
    }else{
        this.disabled = true;
    }
});

//下一页的监听点击事件
document.getElementById('nextpage').addEventListener('click', function(){
    if(connection.isInitiator){
        connection.send({
            data:"next",
            isMessage:true
        });
        //document.getElementById('my_frame').contentWindow.onNextPage();
        onNextPage();
    }else{
        this.disabled = true;
    }
});
/*放大*/
document.getElementById('enlarge').addEventListener('click',function(){
    enlarge();
});
/*缩小*/
document.getElementById('narrow').addEventListener('click', function () {
    narrow();
});
var image = document.getElementById('preview-image');
connection.onpartofscreen = function(event) {
    if(!connection.isInitiator) {
        this.disabled = true;
        console.log("get show" + event.screenshot);
        //image.src = event.screenshot;
        var img = new Image();
        img.src = event.screenshot
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0);
    }else{
        this.disabled = true;
        var img = new Image();
        img.src = event.screenshot;

        var canvas = document.getElementById("canvas");
        var canvas1 = document.createElement('canvas');
        canvas1.width="800";
        canvas1.height="520";

        var ctx = canvas.getContext("2d");
        var ctx1 = canvas1.getContext("2d");
        ctx1.globalAlpha = 1;
        ctx1.drawImage(img, 0, 0);
        ctx.drawImage(canvas1,0,0);
        connection.send({
            data:"clearcanvas",
            isMessage:true,
        });
    }
};
//自定义的接收函数
connection.onacceptMessage = function(event){
    if(event.isMessage){
        if(event.data == "prev"){
            if(!connection.isInitiator){
                onPrevPage();
            }
        }else if(event.data == "next"){
            if(!connection.isInitiator){
                onNextPage();
            }
        }
        else if(event.data == "myshare"){

        }else if(event.data == "clearcanvas"){
            var canvas = document.getElementById("canvas");
            context.clearRect(0,0,canvas.width,canvas.height);
        }
    }
}
var chatContainer = document.querySelector('.chat-output');
document.getElementById('input-text-chat').onkeyup = function(e) {
    var date = new Date();
    var dateString = date.toLocaleTimeString();
    if(e.keyCode != 13) return;
    // removing trailing/leading whitespace
    this.value = this.value.replace(/^\s+|\s+$/g, '');

    if (!this.value.length) return;
    var contentDiv = '<div>' + this.value + '</div><label>'+dateString+'</label>';
    var usernameDiv = '<span>' + connection.userid + '</span>';
    var sendinfo = usernameDiv + contentDiv;
    connection.send(sendinfo);
    appendUser(sendinfo);
    console.log(connection.userid+":"+this.value);
    this.value =  '';
};

connection.onmessage = appendGuest;

function appendUser(event) {
    var div = document.createElement('section');
    div.className = 'user';
    div.innerHTML = event.data || event;
    console.log(event.data);
    //chatContainer.insertBefore(div, chatContainer.firstChild);
    chatContainer.appendChild(div);
    div.tabIndex = 0;
    div.focus();
    document.getElementById('input-text-chat').focus();
}

// a custom method used to append a new DIV into DOM
function appendGuest(event) {
    var div = document.createElement('section');
    div.className = 'service';
    div.innerHTML = event.data || event;
    console.log(event.data);
    //chatContainer.insertBefore(div, chatContainer.firstChild);
    chatContainer.appendChild(div);
    div.tabIndex = 0;
    div.focus();
    document.getElementById('input-text-chat').focus();
}

// 用户退出
document.getElementById('logout1').onclick = function () {
    if(FlagOnMeeting) {
        return alert('请先关闭会议再登出！');
    }
   this.setAttribute("href","logout?uname="+globalclientUser);
};
//  邀请所有人加入房间
document.getElementById('invite_all').onclick = function () {
    var roomInfo = {
        owner: globalclientUser,
        channel: connection.channel,
        sessionid: connection.sessionid
    };
    signaler.socket.emit('invite_all_user', roomInfo, function (friends) {
        for(var m in friends)
            emitInviteSig(friends[m].user);
    });
};

document.getElementById('close').onclick = function () {
    if(!FlagOnMeeting || !connection.isInitiator) {
        return;
    }
    if(!alertBox_CloseRoom())
        return;
    close_currentRoom();
};
document.getElementById('out_room').onclick = function () {
    return FlagOnMeeting ? out_room() : null;
};

//  弹出 请求是否真的关闭会议
function alertBox_CloseRoom() {
    //利用对话框返回的值 （true 或者 false）
    if(confirm("您要选择关闭会议，请确认！"))
    {//如果是true ，那么就是同意加好友
        return true;
    }
    else
    {//否则就是不同意
        return false;
    }
}
function close_currentRoom() {
    var ejectAllInfo = {
        owner: globalclientUser,
        channel: connection.channel,
        sessionid: connection.sessionid
    };
    signaler.socket.emit('eject_all_user', ejectAllInfo, function (err) {

        return err? alert(err) : alert("关闭会议" + "成功！");
    });
    connection.close();
    disableFuncButton();
    document.getElementById('open').disabled = false;
    FlagOnMeeting = false;
}

connection.onSessionClosed = function (session) {
    if(session.isEjected) {
        alert('你被请出了会议！');
    }
    else {
        alert('发起人关闭了会议！');
    }
    out_room();
};

//  对单个的用户发送邀请链接
function emitInviteSig (friend) {
    var roomInfo = {
        owner: globalclientUser,
        channel: connection.channel,
        sessionid: connection.sessionid,
        friend: friend
    };
    if(connection.isInitiator) {
        signaler.socket.emit('inviteIntoRoom', roomInfo);
        alert("已给用户" + roomInfo.friend + "发送邀请！");
    } else {
        alert("你不是创建者!不能邀请");
    }
}

//  退出房间
function out_room () {
    if(!connection.isInitiator) {
        connection.leave();
        FlagOnMeeting = false;
        signaler.socket.emit('out_room');
        location.reload();
    }
}

function disableFuncButton() {
    document.getElementById('close').disabled = true;
    document.getElementById('invite_all').disabled = true;
    document.getElementById('out_room').disabled = true;

};

function enableFuncButton() {
    document.getElementById('close').disabled = false;
    document.getElementById('invite_all').disabled = false;
};

(function BeforeDepart_WebPage() {
    window.onunload = onunload_handler;

    function onunload_handler() {
        if (FlagOnMeeting && connection.isInitiator) {
            //  如果有会议的存在且是会议创建人  ，那么就提醒用户，先关闭会议房间再退出
            // 同时，将活动会议的相关信息，发送到服务器，这样服务器在检测到disconnect事件的时候就去手动删除那些需要清除的会议信息。
            var data = {
                type: 'clear_meeting_routs',
                meeting_routs: {
                    channel: connection.channel,
                    sessionid: connection.sessionid,
                    owner: globalclientUser
                }
            };
            signaler.socket.emit('try_DepartPage', data);
            close_currentRoom();
            var warning = "离开页面前请先关闭会议房间";
            return warning;
        }
        if(FlagOnMeeting && !connection.isInitiator) {
            out_room();
        }

    }
})();



