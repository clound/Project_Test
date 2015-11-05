$(function(){
	var flagfile = 0, flagvideo = 0, flagright = 0;
	$('#rightArrow').on("click",function(){//聊天区管理
			if(flagright==1){
				$("#floatchat").animate({right: '-100%'},300);
				flagright=0;
			}else{
				$("#floatchat").animate({right: '1px'},300);
				flagright=1;
			}
	});
	$('#leftArrow').on("click",function(){//好友文件区管理
			if(flagfile==1){
				$("#friend_file").animate({left: '-102%'},300);
				$(this).removeClass("menu_style_show");
				flagfile=0;
			}else{
				if(flagvideo == 1){
					$("#sharevideo").animate({left: '-102%'},300);
					$("#leftvideo").removeClass("menu_style_show");
					flagvideo=0;
				}
				$("#friend_file").animate({left: '1px'},300);
				$(this).addClass("menu_style_show");
				flagfile=1;
			}
	});
	$('#leftvideo').on("click",function(){//视频区管理
			if(flagvideo==1){
				$("#sharevideo").animate({left: '-102%'},300);
				$(this).removeClass("menu_style_show");
				flagvideo=0;
			}else{
				if(flagfile == 1){
					$("#friend_file").animate({left: '-102%'},300);
					$("#leftArrow").removeClass("menu_style_show");
					flagfile=0;
				}
				$("#sharevideo").animate({left: '1px'},300);
				$(this).addClass("menu_style_show");
				flagvideo=1;

			}
	});
});