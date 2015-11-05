       
		//撤销的array
		var cancelList = new Array();
		//撤销的次数
		var cancelIndex = 0;

		$(function(){
			initCanvas();
			initDrag();
			$("img")[0].click();
			$("#color input").click(chooseColor);
		});		

		//初始化
		var initCanvas = function(){
			canvas =  document.getElementById("canvas");
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			context = canvas.getContext('2d');
			canvasTop = $(canvas).offset().top;
			canvasLeft = $(canvas).offset().left;
	

			canvas_bak =  document.getElementById("canvas_bak");
			canvas_bak.width = canvasWidth;
			canvas_bak.height = canvasHeight;
			context_bak = canvas_bak.getContext('2d');		
		}	
		
		//下载图片
		//var downloadImage = function(){
		//	$("#downloadImage_a")[0].href=canvas.toDataURL();
		//	$("#downloadImage_a").click();
		//}

		//展开颜色选择器
		var showColor = function(obj){
			if($("#color").is(":hidden")){
				var top = $(obj).position().top;
				var left = $(obj).position().left;
				$("#color")[0].style.left = left + "px";
				$("#color")[0].style.top = top + "px";
				$("#color").show();
			}
			else{
				$("#color").hide();
			}
		
		}
		//展开线条大小选择器
		var showLineSize = function(obj){
			if($("#line_size").is(":hidden")){
				var top = $(obj).position().top+35;
				var left = $(obj).position().left;
				$("#line_size")[0].style.left = left + "px";
				$("#line_size")[0].style.top = top + "px";
				$("#line_size").show();
			}else{
				$("#line_size").hide();
			}
		}

		//选择颜色
		var chooseColor = function(obj){		
			var objClass = $(this).attr("class");
			$("#chooseColor").attr("class" , "");
			$("#chooseColor").addClass (objClass).addClass('border_nochoose');			
			color  = $(this).css('background-color');
			$("#color").hide();

		}

		//选择大小
		var chooseLineSize =  function(_size){		
			$("#chooseSize").attr("src" , "/resource/image/line_size_"+_size+".png");
			size = _size;
			$("#line_size").hide();
		}



		//撤销上一个操作
		var cancel = function(){
			cancelIndex++;
			context.clearRect(0,0,canvasWidth,canvasHeight);
			var  image = new Image();
			var index = cancelList.length-1 - cancelIndex  ;
			var url = cancelList[index];
			image.src = url;
			image.onload = function(){
				context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			}
		}

		//重做上一个操作
		var next = function(){
			cancelIndex--;
			context.clearRect(0,0,canvasWidth,canvasHeight);
			var  image = new Image();
			var index = cancelList.length-1 - cancelIndex  ;
			var url = cancelList[index];
			image.src = url;
			image.onload = function(){
				context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
			}
		}

		//保存历史 用于撤销
		var saveImageToAry = function (){
			cancelIndex = 0;
			var dataUrl =  canvas.toDataURL();
			cancelList.push(dataUrl);		
		}		
		
        // 处理文件拖入事件，防止浏览器默认事件带来的重定向  
        function handleDragOver(evt) {  
			evt.stopPropagation();  
			evt.preventDefault();  
         }
		 

		// 判断是否图片  
		function isImage(type) {  
			switch (type) {  
			case 'image/jpeg':  
			case 'image/png':  
			case 'image/gif':  
			case 'image/bmp':  
			case 'image/jpg':  
				return true;  
			default:  
				return false;  
			}  
		}  


		 // 处理拖放文件列表  
		function handleFileSelect(evt) {  
			evt.stopPropagation();  
			evt.preventDefault();  
  
			var files = evt.dataTransfer.files;  
  
			for (var i = 0, f; f = files[i]; i++) {    
				var t = f.type ? f.type : 'n/a';
				reader = new FileReader();
				isImg = isImage(t);
				  
				// 处理得到的图片  
				if (isImg) {  
					reader.onload = (function (theFile) {  
						return function (e) {  
							var  image = new Image(); 
							image.src =  e.target.result ;
							image.onload = function(){
								context.drawImage(image , 0 ,0 , image.width , image.height , 0 ,0 , canvasWidth , canvasHeight);
							}

						};  
					})(f)  
					reader.readAsDataURL(f);  
				}   
			}    
		}  

		//初始化拖入效果
		var initDrag= function(){
			var dragDiv  = document.getElementById("canvas_bak");
			dragDiv.addEventListener('dragover', handleDragOver, false);  
			dragDiv.addEventListener('drop', handleFileSelect, false);  
		}
	