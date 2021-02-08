
// var mainURL="localhost:3000";
var mainURL = "https://instabook.herokuapp.com";
var socketIO = io(mainURL);
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


function showaddPostProfile(user){
    document.getElementById("profile-image-display").setAttribute("src",user.profileImage);
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
                if(typeof isUpdateProfile !== "undefined" && isUpdateProfile)
                {
                    showProfileData(response.data);
                }
                if(typeof isHome !== "undefined" && isHome)
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
                if (typeof isProfile !== "undefined" && isProfile) {
                    showProfile();
                }
                if (typeof isMessages !== "undefined" && isMessages) {
                    showMessageFriends();
                }
                if (typeof isMessageBox !== "undefined" && isMessageBox) {
                    showMessageBox();
                }
                if (typeof isNotifications !== "undefined" && isNotifications) {
                    showNotifications();
                }
                document.getElementById("ownerProfile").setAttribute("href",mainURL+"/user/"+window.user.username);
                document.getElementById("ownerProfile2").setAttribute("href",mainURL+"/user/"+window.user.username);
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


    function showSearchResults() {
        var ajax = new XMLHttpRequest();
        ajax.open("POST", "/search", true);
        
        ajax.onreadystatechange = function() {

            if (this.readyState == 4 && this.status == 200){
                var response = JSON.parse(this.responseText);

                if (response.status == "success")
                {
                    var html = "";
                    if(response.data.length==0 || (response.data.length==1 && response.data[0]._id==window.user._id))
                    {
                        alert("No match found. Search Another User !!");
                    }
                    else{
                        for (var a = 0; a < response.data.length; a++) {
						var data = response.data[a];

						if (data._id == window.user._id) {
							continue;
                        } 
                        var isFriend=false;
                        for(var b=0; b<window.user.friends.length; b++)
                        {
                            var tempdata=window.user.friends[b];
                            var friendRequestStatusPending=false;
                            var showAcceptReject=false;
                            if(tempdata._id==data._id)
                            {   
                                if(tempdata.status=="Pending")
                                {
                                    if(tempdata.sentByMe)
                                    {
                                        friendRequestStatusPending=true;
                                    }
                                    else{
                                        showAcceptReject=true;
                                    }
                                }

                                isFriend=true;
                                break;
                            }
                        }
                        html+='<div class="backgroundDiv" style="margin: 5px auto;" >';
                            html+='<div class="username-profileimage" style="border-bottom: none;">';
                                html+='<label>';
                                    html+='<a href="/user/'+data.username+'" style="display: flex; align-items: center; text-decoration: none; color: black; margin: 10px 0;">';
                                        var proImage=getProfileImage(data._id); 
                                        html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="' + proImage + '">';
                                            html+='<label style="cursor: pointer;">';
                                                html+='<h3 >'+data.username+'</h3>';
                                                    html+='</label>';
                                                    html+='</a></label>';
                                                    if(isFriend)
                                                    {
                                                        if(friendRequestStatusPending)
                                                        {
                                                            html+='<div><div class="unfriend-button" >';
                                                            
                                                            html+=' Request Pending!';
                                                        html+='</div></div>';
                                                        }
                                                        else if (showAcceptReject){
                                                            
                                                            html+='<div style="display:flex;"><div class="unfriend-button" style="margin:30px 10px; width:70px; background: linear-gradient(45deg,#f09433 0%,#e6683c 25%, #dc2743 50%,#cc2366 75%, #bc1888 100% );color: white;"  >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doAccept(this);" style="text-decoration: none; color: white;" >'; 
                                                            html+='Accept</a>';
                                                        html+='</div>';
                                                        html+='<div class="unfriend-button" style="margin:30px 10px; width:70px;" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >'; 
                                                            html+='Reject</a>';
                                                        html+='</div></div>';
                                                        

                                                        }
                                                        else{
                                                            html+='<div><div class="unfriend-button" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >'; 
                                                            html+='Unfriend <i class="ti-back-left"></i></a>';
                                                        html+='</div></div>';
                                                        }
                                                        
                                                    }
                                                    else{
                                                        html+='<div><div class="unfriend-button" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="sendFriendRequest(this);" style="text-decoration: none; color: black;" >';
                                                            html+='Send Request + </a>';
                                                        html+='</div></div>';
                                                    }
                                                    html+='</div></div>';
                        
                    
                    }
                    }
					
                    document.getElementById("searchResults").innerHTML=html;
                }
                else{
                    alert(response.message);
                }
            }
        };



        var formData = new FormData();
		formData.append("query", document.getElementById("query").value);
		ajax.send(formData);
    }

    function sendFriendRequest(self)
    {
        var _id=self.getAttribute("data-id");
        var ajax=new XMLHttpRequest();
        ajax.open("POST","/sendFriendRequest",true);

        ajax.onreadystatechange=function()
        {
            if(this.readyState==4 && this.status==200)
            {
                var response=JSON.parse(this.responseText);

                alert(response.message);
                if(response.status=="success"){
                    self.remove();
                    location.reload();
                }
                
            }
        };

        var formData=new FormData();
        formData.append("_id",_id);
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);
    }


    function doAccept(self)
    {
        var _id=self.getAttribute("data-id");
        var ajax = new XMLHttpRequest();
        ajax.open("POST", "/acceptFriendRequest", true);

        ajax.onreadystatechange=function()
        {
            if(this.readyState==4 && this.status==200)
            {
                var response=JSON.parse(this.responseText);
                alert(response.message);
                self.remove();
                location.reload();
            }
        };

        var formData = new FormData();
        formData.append("_id",_id);
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);


    }

    function doUnfriend(self)
    {
        if(confirm("Are you sure?")){
            var _id=self.getAttribute("data-id");
        var ajax = new XMLHttpRequest();
        ajax.open("POST", "/unfriend", true);

        ajax.onreadystatechange=function()
        {
            if(this.readyState==4 && this.status==200)
            {
                var response=JSON.parse(this.responseText);
                alert(response.message);
                self.remove();
                location.reload();
            }
        };

        var formData = new FormData();
        formData.append("_id",_id);
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);
        }
        


    }



    function showNotifications()
    {

        var ajax= new XMLHttpRequest();
        ajax.open("POST","getnotifications",true);

        ajax.onreadystatechange = function()
        {
            if(this.readyState==4 && this.status==200)
            {
                var response=JSON.parse(this.responseText);
                console.log(response);

                if(response.status=="success"){
                    var html='';
                    var notificationss=response.data;
                    notificationss.sort(function(a,b){
                        var x=a.createdAt;
                        var y=b.createdAt;
                        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
                    });
                   

                    for( var i=0; i<notificationss.length;i++)
                    {
                        var notification=notificationss[i];
                        if(notification.type=="friend_request"){

                            html+='<div class="backgroundDiv" style="margin-top: 5px; margin-bottom: 5px;"><div class="notifications" ><div class="notification-content" >';
                                html+='<h4>';
                                    html+=notification.content;
                                    html+='</h4>';
                                    var createdAt = new Date(notification.createdAt);
                                    var date = createdAt.getDate() + "";
                                    date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();
                                    html+=date;
                                    html+='</div>';
                                    for (var j=0 ; j<window.user.friends.length;j++)
                                    {
                                        var friend=window.user.friends[j];
                                        if(friend._id==notification.senders_id)
                                        {
                                            if(friend.status=="Accepted"){

                                                html+='<div class="accept-buttons" style="display: flex;">';
                                                    html+='<div class="unfriend-button" style="margin:30px 10px; width:70px;" >';
                                                        html+='<a href="javascript:void(0);" data-id="'+friend._id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >'; 
                                                            html+='Unfriend</a>';
                                                        html+='</div>';
                                                    html+='</div></div>';
                                            } 
                                            else if (friend.status=="Pending")
                                            {
                                                if(!friend.sentByMe)
                                                {
                                                    html+='<div class="accept-buttons" style="display: flex;">';
                                        html+='<div class="unfriend-button" style="margin:30px 10px; width:70px; background: linear-gradient(45deg,#f09433 0%,#e6683c 25%, #dc2743 50%,#cc2366 75%, #bc1888 100% );color: white;"  >';
                                            html+='<a href="javascript:void(0);" data-id="'+notification.senders_id+'" onclick="doAccept(this);" style="text-decoration: none; color: white;" >'
                                              html+='Accept</a></div>';
                                              html+='<div class="unfriend-button" style="margin:30px 10px; width:70px;" >';
                                                html+='<a href="javascript:void(0);" data-id="'+notification.senders_id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >';
                                                    html+='Reject</a></div></div></div>';
                                                }
                                                
                                            }
                                        }
                                    }
                                    html+='</div>';

                        }
                        else {
                            html+='<div class="backgroundDiv" style="margin-top: 5px; margin-bottom: 5px;"><div class="notifications" ><div class="notification-content" >';
                                html+='<h4>';
                                    html+=notification.content;
                                    html+='</h4>';
                                    var createdAt = new Date(notification.createdAt);
                                    var date = createdAt.getDate() + "";
                                    date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();
                                    html+=date;
                                    html+='</div></div></div>';
                        }
                    }
                document.getElementById("notifications").innerHTML=html;
                } else {
                    alert(response.message);
                }
            }
        };

        var formData = new FormData();
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);
        



    }



    function showProfile(){
        var username=document.getElementById("userProfile").value;
        var ajax=new XMLHttpRequest();
        ajax.open("POST","/getUserProfile",true);

        ajax.onreadystatechange=function(){
            if (this.readyState == 4 && this.status == 200)
            {
                var response=JSON.parse(this.responseText);
                if(response.status=="success"){
                    var data=response.data;
                    var ownerProfile=response.ownerProfile;
                    var isFriend=response.isFriend;
                    var otherUser=response.otherUser;
                    var count=0;
                    for(var i=0;i<data.friends.length;i++)
                                                {
                                                    var friend=data.friends[i];
                                                    if(friend.status=="Accepted"){
                                                        count++;
                                                    }
                                                }
                    var html='';
                    html+='<div class="backgroundDiv" style="display: flex; flex-direction: row;" >';
                        html+='<div class="image-name-about" >';
                            var proImage=getProfileImage(data._id); 
                            html+='<img src="' + proImage + '">';
                            html+='<h3>';
                                html+=data.name;
                                html+='</h3>';
                                html+='<p>';
                                    html+=data.aboutMe;
                                    html+='</p>';
                                    html+='</div>';
                                    html+='<div class="friends-posts-button" ><div class="friends-posts" ><div class="posts-number">';
                                        html+='<h3>';
                                            html+=data.posts.length;
                                            html+='</h3>';
                                            html+='<h3>Posts</h3>';
                                            html+='</div>';
                                            html+='<div class="friends-number">';
                                                html+='<h3>';
                                            html+=count;
                                            html+='</h3>';
                                            html+='<h3>Friends</h3>';
                                            html+='</div></div>';
                                            if(ownerProfile===true){
                                                html+='<div style="display:flex;flex-direction: row;align-items: center;justify-content: space-evenly;"><div class="unfriend-button" style="margin:30px 10px;  background: linear-gradient(45deg,#f09433 0%,#e6683c 25%, #dc2743 50%,#cc2366 75%, #bc1888 100% );color: white;"  >';
                                                            html+='<a href="'+mainURL+'/updateProfile"  style="text-decoration: none; color: white;" >'; 
                                                            html+='Update</a>';
                                                        html+='</div>';
                                                        html+='<div class="unfriend-button" style="margin:30px 10px; " >';
                                                            html+='<a href="'+mainURL+'/friends"  style="text-decoration: none; color: black;" >'; 
                                                            html+='Friend List</a>';
                                                        html+='</div></div></div></div>';

                                                            for(var i=0;i<data.posts.length;i++){

                                                                var post=data.posts[i];
                                                                html+='<div class="backgroundDiv postCard">';
                                                                    html+='<div class="username-profileimage" >';
                                                                        html+='<label >';
                                                                            html+='<a href="/user/'+data.username+'" style="display: flex; align-items: center; text-decoration: none; color: black; margin: 10px 0;">';
                                       
                                                                                html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="' + data.profileImage + '">';
                                                                                html+='<label style="display: flex; flex-direction: column;" ><h3 >'+data.username+'</h3>';
                                                                                    var createdAt = new Date(post.createdAt);
                                                                                var date = createdAt.getDate() + "";
                                                                                date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();                         
                                                                                html+='<h4 style="font-weight: lighter;">'+date+'</h4></label></a></label>';
                                                                                if(data.username==window.user.username)
                                                                                {
                                                                                    html+='<span class="delete" onclick="deletePost(this);" data-id="' + post._id + '">';
                                                                                        html+='<i class="ti-trash" style="font-size: 30px;"></i>';
                                                                                        html+='</span>';
                                                                                }
                                                                                html+='</div>';
                                                                                html+='<div class="post-image-video" style="padding: 10px; border-bottom: 1px solid rgba(133, 130, 130, 0.486);">';
                                                                                if (post.image != "") {
                                                                                    html+='<img src="'+ post.image + '" style="height: 300px; width: 300px; padding: 10px; ">';
                                                                                }
                                                                                if (post.video != "") {
                                                                                    html+='<video style="height: 300px; width: 300px; padding: 10px; outline: none;" controls src="'+ post.video + '"></video>';     
                                                                                }
                                                                                html+='<div class="post-caption">'+ post.caption+'</div></div>';
                                                                                html+=createLikesSection(post);
                                                                                html += "<div id='post-comments-" + post._id + "'>";
                                                                                html += createCommentsSection(post);
                                                                                html += "</div>";
                                                                                html+='</div>';
                                }



                                            } else if (isFriend===true){
                                                var friendStatus='';
                                                var sentStatus=false;
                                                for(var i=0;i<window.user.friends.length;i++)
                                                {
                                                    var friend=window.user.friends[i];
                                                    if(friend._id==data._id){
                                                        friendStatus=friend.status;
                                                        sentStatus=friend.sentByMe;
                                                        break;

                                                    }
                                                }



                                                if(friendStatus=="Accepted")
                                                {
                                                    html+='<div style="display:flex;flex-direction: row;align-items: center;justify-content: space-evenly;"><div class="unfriend-button" style="margin:30px 10px; width:70px; background: linear-gradient(45deg,#f09433 0%,#e6683c 25%, #dc2743 50%,#cc2366 75%, #bc1888 100% );color: white;"  >';
                                                            html+='<a href="/messages/'+data.username+'/'+data._id+'"  style="text-decoration: none; color: white;" >'; 
                                                            html+='Message</a>';
                                                        html+='</div>';
                                                        html+='<div class="unfriend-button" style="margin:30px 10px; width:70px;" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >'; 
                                                            html+='Unfriend</a>';
                                                        html+='</div></div></div></div>';
                                                        for(var i=0;i<data.posts.length;i++){

                                                                var post=data.posts[i];
                                                                html+='<div class="backgroundDiv postCard">';
                                                                    html+='<div class="username-profileimage" >';
                                                                        html+='<label >';
                                                                            html+='<a href="/user/'+data.username+'" style="display: flex; align-items: center; text-decoration: none; color: black; margin: 10px 0;">';

                                                                                html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="'+ data.profileImage + '">';
                                                                                html+='<label style="display: flex; flex-direction: column;" ><h3 >'+data.username+'</h3>';
                                                                                    var createdAt = new Date(post.createdAt);
                                                                                var date = createdAt.getDate() + "";
                                                                                date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();                         
                                                                                html+='<h4 style="font-weight: lighter;">'+date+'</h4></label></a></label>';
                                                                                if(data.username==window.user.username)
                                                                                {
                                                                                    html+='<span class="delete" onclick="deletePost(this);" data-id="' + post._id + '">';
                                                                                        html+='<i class="ti-trash" style="font-size: 30px;"></i>';
                                                                                        html+='</span>';
                                                                                }
                                                                                html+='</div>';
                                                                                html+='<div class="post-image-video" style="padding: 10px; border-bottom: 1px solid rgba(133, 130, 130, 0.486);">';
                                                                                if (post.image != "") {
                                                                                    html+='<img src="'+ post.image + '" style="height: 300px; width: 300px; padding: 10px; ">';
                                                                                }
                                                                                if (post.video != "") {
                                                                                    html+='<video style="height: 300px; width: 300px; padding: 10px; outline: none;" controls src="'+ post.video + '"></video>';     
                                                                                }
                                                                                html+='<div class="post-caption">'+ post.caption+'</div></div>';
                                                                                html+=createLikesSection(post);
                                                                                html += "<div id='post-comments-" + post._id + "'>";
                                                                                html += createCommentsSection(post);
                                                                                html += "</div>";
                                                                                html+='</div>';
                                                                }



                                                        

                                                } else if (friendStatus=="Pending"){
                                                    if(sentStatus)
                                                        {
                                                            html+='<div class="unfriend-button"  >';
                                                            
                                                            html+=' Request Pending!';
                                                        html+='</div></div></div>';
                                                        html+='<div>';
                                                            html+='<img src="'+ mainURL+'/public/icons/lock.svg" style="width:400px; height:400px;margin:30px;">';
                                                            html+='</div>';
                                                        }
                                                    else{
                                                            
                                                        html+='<div style="display:flex;flex-direction: row;align-items: center;justify-content: space-evenly;"><div class="unfriend-button" style="margin:30px 10px; width:70px; background: linear-gradient(45deg,#f09433 0%,#e6683c 25%, #dc2743 50%,#cc2366 75%, #bc1888 100% );color: white;"  >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doAccept(this);" style="text-decoration: none; color: white;" >'; 
                                                            html+='Accept</a>';
                                                        html+='</div>';
                                                        html+='<div class="unfriend-button" style="margin:30px 10px; width:70px;" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >'; 
                                                            html+='Reject</a>';
                                                        html+='</div></div></div></div>';
                                                        html+='<div>';
                                                            html+='<img src="'+ mainURL+'/public/icons/lock.svg" style="width:400px; height:400px;margin:30px;">';
                                                            html+='</div>';
                                                        }

                                                }
                                            } else if (otherUser ===true){
                                                
                                                html+='<div class="unfriend-button" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="sendFriendRequest(this);" style="text-decoration: none; color: black;" >';
                                                            html+='Send Request + </a>';
                                                        html+='</div></div></div>';
                                                        html+='<div>';
                                                            html+='<img src="'+ mainURL+'/public/icons/lock.svg" style="width:400px; height:400px; margin:30px;">';
                                                            html+='</div>';
                                            }

                                            
                    document.getElementById("userProfileDisplay").innerHTML=html;

                } else {
                    alert(response.message);
                    
                }
            }
        };



        var formData=new FormData();
        formData.append("username",username);
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);
    }


    function showMessageFriends(){
        var html='';
        for(var a=0;a<window.user.friends.length;a++){
            var data=window.user.friends[a];
            if(data.status=="Accepted")
            {
                
                    html+='<div class="backgroundDiv" style="margin: 5px auto; " >';
                        html+='<div class="username-profileimage" style="border-bottom: none; cursor:pointer" onclick="redirect(\''+data.username+'\',\''+data._id+'\');">';
                            html+='<label>';
                                html+='<a href="/user/'+data.username+'" style="display: flex; align-items: center; text-decoration: none; color: black; margin: 10px 0;">';
                                    var proImage=getProfileImage(data._id); 
                                        html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="' + proImage + '">';
                                            html+='<label style="cursor: pointer;">';
                                                html+='<h3 >'+data.name+'</h3>';
                                                    html+='</label>';
                                                    html+='</a></label>';
                                                    html+='</div>';
                                                    
                                                    html+='</div>';
                                                    
            }
        }
        document.getElementById("friends2").innerHTML=html;
        
    }
    

    function redirect(username,id){
        window.location.href=mainURL +'/messages/'+username+'/'+id;
    } 

    function showFriends()
    {
        var html='';
        for(var a=0;a<window.user.friends.length;a++)
        {
            var data=window.user.friends[a];
            if(data.status=="Accepted")
            {
                html+='<div class="backgroundDiv" style="margin: 5px auto;" >';
                            html+='<div class="username-profileimage" style="border-bottom: none;">';
                                html+='<label>';
                                    html+='<a href="/user/'+data.username+'" style="display: flex; align-items: center; text-decoration: none; color: black; margin: 10px 0;">';
                                        var proImage=getProfileImage(data._id); 
                                        html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="'+ proImage + '">';
                                            html+='<label style="cursor: pointer;">';
                                                html+='<h3 >'+data.username+'</h3>';
                                                    html+='</label>';
                                                    html+='</a></label>';
                                                    html+='<div><div class="unfriend-button" >';
                                                            html+='<a href="javascript:void(0);" data-id="'+data._id+'" onclick="doUnfriend(this);" style="text-decoration: none; color: black;" >'; 
                                                            html+='Unfriend <i class="ti-back-left"></i></a>';
                                                                html+='</div></div>';
                                                                html+='</div></div>';
                                                        

                
            }
            
        }
        document.getElementById("friends").innerHTML=html;

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
        html+='<div class="comment-input" >';
            html+='<a href="/user/'+ window.user.username +'" style="display: flex; align-items: center; color:black; text-decoration: none;">';
                html+='<img src="'+ window.user.profileImage + '" class="comment-input-image" >';
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
                                    html+='<img src="'+ proImage +'" style="width: 60px; height:60px;border-radius: 100%; margin: 10px; " >';
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
                                                        html+='<img src="'+ proImage + '" style="width: 50px;height:50px; border-radius: 100%;margin-right: 10px;" >';
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
                
                if(response.status=="success"){
                    location.reload();
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



function showMessageBox()
    {
        var _id=document.getElementById("userId").value;
        var ajax=new XMLHttpRequest();
        ajax.open("POST","/getPreviousChat",true);
        ajax.onreadystatechange = function()
        {
            if(this.readyState==4 && this.status==200)
            {
                var response=JSON.parse(this.responseText);
                var html='';
                for(var i=0;i<response.data.length;i++){
                    var inbox=response.data[i];
                    if(inbox.from==window.user._id)
                    {
                        html+='<div class="me">';
                            html+='<div>';
                                html+=inbox.message;
                                html+='</div>';
                                html+='</div>';
                    }
                    else{
                        html+='<div class="you">';
                            html+=inbox.message;
                            html+='</div>';
                    }
                }
                document.getElementById("chatBox").innerHTML=html;
                var objDiv=document.getElementById("chatBox");
                objDiv.scrollTop=objDiv.scrollHeight;
                connectSocket();
            }

        };

        var formData=new FormData();
        formData.append("_id",_id);
        formData.append("accessToken",localStorage.getItem("accessToken"));
        ajax.send(formData);


    }

    
    function doSendMessage(form){
        var message=form.message.value;
        var _id=document.getElementById("userId").value;
        var ajax=new XMLHttpRequest();
        ajax.open("POST","/sendMessage",true);

        ajax.onreadystatechange=function(){
            if(this.readyState==4 && this.status==200){
                var response = JSON.parse(this.responseText);

                if(response.status=="success"){
                    var html='';
                    html+='<div class="me">';
                            html+='<div>';
                                html+=message;
                                html+='</div>';
                                html+='</div>';
                    document.getElementById("chatBox").innerHTML +=html;
                    form.message.value='';
                    var objDiv=document.getElementById("chatBox");
                    objDiv.scrollTop=objDiv.scrollHeight;

                }
            }
        };
        var formData = new FormData(form);
        formData.append("accessToken",localStorage.getItem("accessToken"));
        formData.append("_id",_id);
        ajax.send(formData);

        return false;

    }

    function connectSocket()
    {
        var _id=document.getElementById("userId").value;
        var ajax=new XMLHttpRequest();
        ajax.open("POST","/connectSocket",true);
        ajax.onreadystatechange= function(){
            if(this.readyState==4 && this.status==200)
            {
                var response=JSON.parse(this.responseText);

                socketIO.on("messageReceived",function(messageObj){
                    if(messageObj.from==_id)
                    {
                        var html='';
                        html+='<div class="you">';
                            html+=messageObj.message;
                            html+='</div>';
                            document.getElementById("chatBox").innerHTML +=html;
                    
                    var objDiv=document.getElementById("chatBox");
                    objDiv.scrollTop=objDiv.scrollHeight;



                    }
                });
            }
        };
        var formData = new FormData();
        formData.append("accessToken",localStorage.getItem("accessToken"));
       
        ajax.send(formData);

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
                                    html+='<img style="width: 60px; height: 60px; border-radius: 100%;margin: 0 20px; " class="postcard-profileImage" src="'+ proImage + '">';
                                    
                                    html+='<label style="display: flex; flex-direction: column;" ><h3 >'+data.user.username+'';
                                    if(data.type=="shared"){
                                        html+='<img src="'+mainURL+'/public/icons/retweet.svg" style="width:20px;margin-left:50px;"';
                                    }
                                    html+='</h3>';
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
                                        html+='<img src="'+data.image + '" style="height: 300px; width: 300px; padding: 10px; ">';
                                    }
                                    if (data.video != "") {
                                        html+='<video style="height: 300px; width: 300px; padding: 10px; outline: none;" controls src="'+ data.video + '"></video>';     
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
