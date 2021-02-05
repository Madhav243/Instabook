
function showaddPostProfile(user){
    document.getElementById("profile-image-display").setAttribute("src",mainURL + "/" + user.profileImage);
}

function onSearch(button) {
    window.location.href = "/search/" + button.previousElementSibling.value ;
}
function toogle()
{
document.getElementById("nav-2-display").classList.toggle('active');
document.getElementById("tooglebutton").classList.toggle('active2');
}
window.user=null;

function getUser()
{
    if(localStorage.getItem("accessToken"))
    {
        var ajax=new XMLHttpRequest();
        ajax.open("POST","/getUser",true);

        ajax.onreadystatechange = function()
        {
            if (this.readyState == 4 && this.status == 200)
            {
                var response=JSON.parse(this.responseText);
                window.user = response.data;

                if(response.status !="success")
                {
                    alert(response.message);
                    localStorage.removeItem("accessToken");
                }
                if(window.location.href== mainURL+"/updateProfile")
                {
                    showProfileData(response.data);
                }
                if(window.location.href==mainURL+"/home")
                {
                    showaddPostProfile(response.data);
                    showNewsfeed();
                }
                if (typeof isSearchResults !== "undefined" && isSearchResults) {
                    showSearchResults();
                }
                if (typeof isFriends !== "undefined" && isFriends) {
                    showFriends();
                }
                
            }
        };
        var formData = new FormData();
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);
    } else{
        window.location.href=("/login");
        alert("Please login first !");
        
    }
}
function showProfileData(user)
    {   
        
        document.querySelector(".user-name").innerHTML = user.username;
		document.querySelector(".name").value = user.name;
		document.querySelector(".email").innerHTML = user.email;
        document.querySelector(".dob").value = user.dob;
        document.querySelector(".aboutMe").value = user.aboutMe;
        document.getElementById("profile-image").setAttribute("src", mainURL + "/" + user.profileImage);
    }
function uploadImage() {
		var ajax = new XMLHttpRequest();
		ajax.open("POST", "/uploadProfileImage", true);
		ajax.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var response = JSON.parse(this.responseText);
				document.getElementById("profile-image").setAttribute("src", response.data);
			}
		};
        var formData = new FormData();
        formData.append("profileImage",$('input[type=file]')[0].files[0]);
		formData.append("accessToken", localStorage.getItem("accessToken"));
		ajax.send(formData);

		return false;
    }
    
function updateProfile(form)
    {
        form.submit.setAttribute("disabled", "disabled");
		form.submit.innerHTML = "<span>Loading...</span>";
		var ajax = new XMLHttpRequest();
		ajax.open("POST", "/updateProfile",true);
		ajax.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {

				form.submit.removeAttribute("disabled");
				form.submit.innerHTML = "<span>Update</span>";
				var response = JSON.parse(this.responseText);
				alert(response.message);
			}
		};

		var formData = new FormData(form);
		formData.append("accessToken", localStorage.getItem("accessToken"));
		ajax.send(formData);

		return false;
    }

function onSearch(button) {
        window.location.href = "/search/" + button.previousElementSibling.value ;
    }







    



function doLogout()
{
    localStorage.removeItem("accessToken");
    alert("User has been logged out !");
    return true;
}

function previewPostImage(self)
{
    var file = self.files;
    if (file.length>0)
    {
        var fileReader= new FileReader();
        fileReader.onload= function (event)
        {   
            document.getElementById("video-post").value="";
            document.getElementsByClassName("video-display")[0].style.display="none";
            document.getElementsByClassName("imag-display")[0].style.display="block";
            document.getElementsByClassName("add-post-box")[0].style.height="500px";
            document.getElementsByClassName("post-content")[0].style.height="450px";
            document.getElementsByClassName("imag-display")[0].setAttribute("src",event.target.result);
            document.getElementsByClassName("video-display")[0].setAttribute("src","");

        }
        fileReader.readAsDataURL(file[0]);
    }

}

function previewPostVideo(self)
{
    var file=self.files;
    if (file.length>0)
    {
        var fileReader= new FileReader();
        fileReader.onload= function (event)
        {   
            document.getElementById("image-post").value="";
            document.getElementsByClassName("imag-display")[0].style.display="none";
            document.getElementsByClassName("video-display")[0].style.display="block";
            document.getElementsByClassName("add-post-box")[0].style.height="500px";
            document.getElementsByClassName("post-content")[0].style.height="450px";
            document.getElementsByClassName("imag-display")[0].setAttribute("src","");
            document.getElementsByClassName("video-display")[0].setAttribute("src",event.target.result);

        }
        fileReader.readAsDataURL(file[0]);
    }

}
      
function createLikesSection(data)
     {
         var isLiked = false;
         for (var b = 0; b < data.likers.length; b++) {
             var liker = data.likers[b];
             if (liker._id == window.user._id) {
                 isLiked = true;
                 break;
             }
         }
     
         var html = "";
         html+='<div class="like-comment" style="display: flex;flex-direction: row;align-content: space-evenly;justify-content: space-around;padding-top: 10px;">'
             var className = "";
             if (isLiked) {
                 className = "like";
             } else {
                 className = "none";
             }
     
        html+=' <span class="'+ className+'" onclick="toggleLikePost(this); " data-id="' + data._id + '" ><i class="ti-thumb-up" style="font-size: 30px;"></i>';
        html+=' <ins style="font-size: 20px;">'+data.likers.length+'</ins></span>';
         
             html += '<span class="comment" title="Comments">';
                 html+='<i class="ti-comments" style="font-size: 30px;"></i>';
                 html+='<ins style="font-size: 20px;"  id="count-post-comments-' + data._id + '">' + data.comments.length + '</ins>';
                 html+='</span>';
     
             html+='<span class="share" onclick="sharePost(this);" data-id="' + data._id + '">';
                 html+='<i class="ti-share" style="font-size: 30px;"></i>';
                 html+='<ins style="font-size: 20px;" >' + data.shares.length + '</ins>';
                 html+=' </span></div>';
         return html;            
     
     
     }
     
function toggleLikePost(self)
     {
         var _id = self.getAttribute("data-id");
         var ajax = new XMLHttpRequest();
         ajax.open("POST", "/toggleLikePost", true);
     
         ajax.onreadystatechange = function(){
             if (this.readyState == 4 && this.status == 200)
             {
                 var response = JSON.parse(this.responseText);
     
                 if (response.status == "success") {
                     self.className = "like";
     
                     var likes = parseInt(self.querySelector("ins").innerHTML);
                     likes++;
                     self.querySelector("ins").innerHTML = likes;
                     }
                 if (response.status == "unliked") {
                     self.className = "none";
                     var likes = parseInt(self.querySelector("ins").innerHTML);
                     likes--;
                     self.querySelector("ins").innerHTML = likes;
                     }
                 if (response.status == "error") {
                     alert(response.message);
                     }
             }
     
     
         };
     
         var formData = new FormData();
         formData.append("accessToken", localStorage.getItem("accessToken"));
         formData.append("_id", _id);
         ajax.send(formData);
     
     
     }
   
function createCommentsSection(data)
{
    var html="";
    html+='<div class="comment-section" >';
        html+='<div class="comment-input" ">';
            html+='<a href="/user/'+ window.user.username +'" style="display: flex; align-items: center; color:black; text-decoration: none;">';
                html+='<img src="' + mainURL + '/' + window.user.profileImage + '" class="comment-input-image" >';
                html+='<label  class="comment-input-username" ><h4>'+ window.user.username+'</h4> </label></a>';
                html+='<form method="post" onsubmit="return doPostComment(this);" class="comment-input-form">';
                    html += '<input type="hidden" name="_id" value="' + data._id + '">';
                    html += '<textarea class="comment-textarea" name="comment" placeholder="Post your comment" cols="20" rows="2"></textarea>';
                    html += '<button type="submit" style="width: 80px">Comment</button>';
                    html+='</form></div>';
                    html+='<div class="scroll-bar">'
                   
                        data.comments = data.comments.reverse();
                        for (var b = 0; b <data.comments.length; b++)
                        {
                            var comment = data.comments[b];
                            html+='<div class="comment-display">';
                            html+='<div class="user-details">';
                                html+='<a href="/user/'+comment.user.username+'" style="display: flex; align-items: center; color:black; text-decoration: none;">';
                                    var proImage=getProfileImage(comment.user._id);
                                    html+='<img src="'+mainURL + '/' + proImage +'" style="width: 60px; height:60px;border-radius: 100%; margin: 10px; " >';
                                    html+='<label  style="margin-left: 10px; margin-right: 10px;"><h4>'+comment.user.username+'</h4></label>';
                                    var createdAt = new Date(comment.createdAt);
									var date = createdAt.getDate() + "";
									date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();
                                    html += '<span>' + date + '</span>';
                                    html += '<a class="we-reply" href="javascript:void(0);" style="color:black; text-decoration: none; margin-left:10px; font-size: larger; " data-post-id="' + data._id + '" data-comment-id="' + comment._id + '" onclick="prepareToReply(this);" title="Reply"><i class="ti-control-backward"></i></a>';
                                    html+='</div>';
                                    html+='<div class="user-comment" >';
                                        html+=comment.comment;
                                        html+='</div>';
                                        comment.replies = comment.replies.reverse();
                                        for (var c = 0; c < comment.replies.length; c++)
                                        {
                                            var reply = comment.replies[c];
                                            html+='<div class="reply-display" >';
                                                html+='<div class="user-details" >';
                                                    html+='<a href="/user/'+reply.user.username +'" style="display: flex; align-items: center;color:black; text-decoration: none;" >';
                                                        var proImage=getProfileImage(reply.user._id);
                                                        html+='<img src="' + mainURL + '/' + proImage + '" style="width: 50px;height:50px; border-radius: 100%;margin-right: 10px;" >';
                                                        html+='<label  style="margin-left: 10px; margin-right: 10px;"><h4>'+ reply.user.username+'</h4> </label>';
                                                        var createdAt = new Date(reply.createdAt);
												var date = createdAt.getDate() + "";
                                                date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();
                                                html += '<span>' + date + '</span>';
                                                html+=' </a></div>';
                                                html+='<div class="user-comment" >';
                                                html+=reply.reply;
                                                    html += '</div></div>';


                                        }

                                        html+='</div>';
                        }
                        html+='</div>';
                        html+='</div>';
                    return html;
}

function sharePost(self){
    if (confirm("Are you sure you want to share this post ?")){
        var _id = self.getAttribute("data-id");
		var ajax = new XMLHttpRequest();
        ajax.open("POST", "/sharePost", true);
        ajax.onreadystatechange = function(){
            if (this.readyState == 4 && this.status == 200){
                var response = JSON.parse(this.responseText);
                alert(response.message);
                if (response.status == "success"){
                    self.className = "like";
                    var shares = parseInt(self.querySelector("ins").innerHTML);
                    shares++;
                    self.querySelector("ins").innerHTML = shares;
                    showNewsfeed();
                }
            }
        };
        var formData = new FormData();
        formData.append("accessToken", localStorage.getItem("accessToken"));
        formData.append("_id", _id);
        ajax.send(formData);
    
    }
}

function doPostComment(form)
{
    var ajax = new XMLHttpRequest();
    ajax.open("POST", "/postComment",true);

    ajax.onreadystatechange = function()
    {
        if (this.readyState == 4 && this.status == 200) {

            var response = JSON.parse(this.responseText);
            alert(response.message);

            if (response.status == "success") {
                form.comment.value = "";

                var commentsHtml = createCommentsSection(response.updatePost);
                document.getElementById("post-comments-" + form._id.value).innerHTML = commentsHtml;

                var comments = parseInt(document.getElementById("count-post-comments-" + form._id.value).innerHTML);
                comments++;
                document.getElementById("count-post-comments-" + form._id.value).innerHTML = comments;
            }
        }

    };
    var formData = new FormData(form);
    formData.append("accessToken", localStorage.getItem("accessToken"));
    ajax.send(formData);

    return false;
}

function prepareToReply(self) {
    $("#replyModal input[name='postId']").val(self.getAttribute("data-post-id"));
    $("#replyModal input[name='commentId']").val(self.getAttribute("data-comment-id"));
    $("#replyModal").modal("show");
}

function doPostReply(form) {
    var ajax = new XMLHttpRequest();
    ajax.open("POST", "/postReply",true);

    ajax.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            var response = JSON.parse(this.responseText);
            alert(response.message);

            if (response.status == "success") {
                form.reply.value = "";
                $("#replyModal").modal("hide");

                var commentsHtml = createCommentsSection(response.updatePost);
                document.getElementById("post-comments-" + form.postId.value).innerHTML = commentsHtml;
            }
        }
    };

    var formData = new FormData(form);
    formData.append("accessToken", localStorage.getItem("accessToken"));
    ajax.send(formData);

    return false;
			}

function deletePost(self)
{
    if (confirm("Are you sure you want to delete this post ?")){
        var _id = self.getAttribute("data-id");
		var ajax = new XMLHttpRequest();
        ajax.open("POST", "/deletePost", true);
        ajax.onreadystatechange = function(){
            if (this.readyState == 4 && this.status == 200){
                var response = JSON.parse(this.responseText);
                alert(response.message);
                if (response.status == "success"){
                    showNewsfeed();
                }


            }
        };
        var formData = new FormData();
        formData.append("accessToken", localStorage.getItem("accessToken"));
        formData.append("_id", _id);
        ajax.send(formData);
    }
}

function getProfileImage(id)
{
    var ajax = new XMLHttpRequest();
    var imageAddress="";
    ajax.open("POST","/getprofileImage",false) //false make synchronous request
    
    var formData = new FormData();
        formData.append("accessToken", localStorage.getItem("accessToken"));
        formData.append("userid",id);
        ajax.send(formData);
        if (ajax.status == 200)
        {
            var response=JSON.parse(ajax.responseText);
            
            if (response.status == "success"){
                
               imageAddress = response.profileimage;
                }
            
        }
        return imageAddress;
    
}



// async function  getProfileImage(id){
//     var url="/getProfileImage";
//     var imageAddress=""
//     var address=""
//     var data={
//         "accessToken":localStorage.getItem("accessToken"),
//         "userid":id
//     }
//     var params ={
//         method: 'post',
//         headers: {
//             'Content-Type':'application/json'
//         },
//         body:  JSON.stringify(data)
//     }
//     // fetch(url,params).then(response=> response.json()).then((data)=>{
//     //    imageAddress=data.profileimage
//     //    console.log("ImageAddress inside then "+ imageAddress)
//     // })
//     // console.log("ImageAddress outside fetch "+ imageAddress)
//     imageAddress=await fetch(url,params)
//     address=await imageAddress.json()
//     console.log(address.profileimage)
//     return address.profileimage

// }

function showNewsfeed()
    {
         var ajax = new XMLHttpRequest();
         ajax.open("POST", "/getNewsfeed",true);
     
         ajax.onreadystatechange=function()
         {
             if(this.readyState == 4 && this.status == 200)
             {
                 var response = JSON.parse(this.responseText);
                 var html = "";
                     for (var a = 0; a < response.data.length; a++)
                    {
                        var data = response.data[a];
     
                        html+='<div class="backgroundDiv postCard">';
                            html+='<div class="username-profileimage" >';
                                html+='<label >';
                                    html+='<a href="/user/'+data.user.username+'" style="display: flex; align-items: center; text-decoration: none; color: black; margin: 10px 0;">';
                                    var proImage=getProfileImage(data.user._id);   
                                    html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="' + mainURL + "/" + proImage + '">';
                                    html+='<label style="display: flex; flex-direction: column;" ><h3 >'+data.user.username+'</h3>';
                                    var createdAt = new Date(data.createdAt);
                                    var date = createdAt.getDate() + "";
                                    date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();                         
                                    html+='<h4 style="font-weight: lighter;">'+date+'</h4></label></a></label>';
                                    if(data.user.username==window.user.username)
                                    {
                                        html+='<span class="delete" onclick="deletePost(this);" data-id="' + data._id + '">';
                                            html+='<i class="ti-trash" style="font-size: 30px;"></i>';
                                            html+='</span>';
                                    }
                                    html+='</div>';
                                    html+='<div class="post-image-video" style="padding: 10px; border-bottom: 1px solid rgba(133, 130, 130, 0.486);">';
                                    if (data.image != "") {
                                        html+='<img src="' + mainURL + "/" + data.image + '" style="height: 300px; width: 300px; padding: 10px; ">';
                                    }
                                    if (data.video != "") {
                                        html+='<video style="height: 300px; width: 300px; padding: 10px; outline: none;" controls src="' + mainURL + "/" + data.video + '"></video>';     
                                    }
                                        
                                    html+='<div class="post-caption">'+ data.caption+'</div></div>';
                                    html+=createLikesSection(data);
                                    html += "<div id='post-comments-" + data._id + "'>";
                                    html += createCommentsSection(data);
							        html += "</div>";
                                    html+='</div>';
                    }
                     document.getElementById("newsFeed").innerHTML=html;
             }
         };
         var formData = new FormData();
         formData.append("accessToken", localStorage.getItem("accessToken"));
         ajax.send(formData);
    }
     
function doPost(form)
{
    var ajax=new XMLHttpRequest();
    ajax.open("POST","/addPost",true);
    ajax.onreadystatechange = function()
    {
        if( this.readyState == 4 && this.status==200)
        {
            var response=JSON.parse(this.responseText);
            alert(response.message);
            if(response.status=="success")
            {
                document.getElementById("video-post").value="";
                document.getElementById("image-post").value="";
                document.getElementsByClassName("caption-area")[0].value="";
                document.getElementsByClassName("add-post-box")[0].style.height="200px";
                document.getElementsByClassName("post-content")[0].style.height="150px";
                document.getElementsByClassName("imag-display")[0].style.display="none";
                document.getElementsByClassName("video-display")[0].style.display="none";
                document.getElementsByClassName("imag-display")[0].setAttribute("src","");
                document.getElementsByClassName("video-display")[0].setAttribute("src","");
                showNewsfeed();


            }

        }
    };
    var formData =new FormData(form);
    formData.append("accessToken",localStorage.getItem("accessToken"));
    ajax.send(formData);
    return false;
}
