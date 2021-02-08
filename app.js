var express = require("express");
var app = express();

var formidable=require("express-formidable");
app.use(formidable());

require('dotenv').config()

var mongodb= require("mongodb");
var mongoClient=mongodb.MongoClient;
var ObjectId=mongodb.ObjectId;

var ejs = require("ejs");

var http=require("http").createServer(app);
var bcrypt=require("bcrypt");

var fileSystem= require("fs");
var jwt=require("jsonwebtoken");
const { connect } = require("http2");

var accessTokenSceret="ilovesocialmedia";

var nodemailer= require("nodemailer");
var sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(sendgridTransport({
  auth:
  {
    api_key: process.env.SENDGRID_API_KEY
  }
  
})
);

var crypto=require("crypto");

app.set('view engine', 'ejs');

app.use("/public",express.static(__dirname+"/public"));


var socketIO=require("socket.io")(http);
var socketID="";
var users=[];


var cloudinary = require("cloudinary").v2;

cloudinary.config({
cloud_name:'madhav098',
api_key:'983722728548559',
api_secret:'xh5f74XHSHC5chVnIEr6xEzf1Kw'
});

var lodash=require("lodash");

// var mainURL="localhost:3000";
var mainURL="https://instabook.herokuapp.com";
// var mainURL=__dirname;
//main url also in header chnge  and footer alsowhile deploying

socketIO.on('connection',function(socket)
{
  
  socketID=socket.id;

}
);
// process.env.PORT
http.listen(3000, function() {
  

  mongoClient.connect("mongodb+srv://madhav:madhav123@instabook.fjgbv.mongodb.net/",function(error,client){
    var database=client.db("instabook");
   

  //get signup 
    app.get("/signup",function(req,res){
    res.render("signup")
  });
  //get signup ended
  //post signup
  app.post("/signup",function(req,result)
  {
  var name=req.fields.name;
  var username=req.fields.username;
  var email=req.fields.email;
  var password=req.fields.password;

    //now check if username already exists or not

    database.collection("users").findOne(
      {
        $or:
        [{
            "email":email
          },{
            "username":username
          }]
      },function(error,user)
      {
        if (user==null)
        { //username not exists so add new profile..
          bcrypt.hash(password,10,function(error,hash){
            database.collection("users").insertOne({
              "name":name,
              "email":email,
              "password":hash,
              "username":username,
              "profileImage":"public/icons/user.svg",
              "dob":"",
              "aboutMe":"",
              "friends": [],
              "notifications":[],
              "posts":[],
              "resetToken":"",
              "expireToken":"",

            },function(error,data){
              result.json({
                "status":"success",
                "message":"Signed Up Successfully "
              });

            });

          });
        }
        else{
          result.json({
            "status":"error",
            "message":"Email or Username already exist."
          });
        }
      });
    });
    //post signup ended
  
    //get home route
    app.get("/",function(req,res)
    {
       res.redirect("/login");
      //res.redirect("/updateProfile");
    });
    //get home ended

    //get login 
    
    app.get("/login",function(request,result)
    {
    
      result.render("login");
    });
    //get login ended

    //post login 
    app.post("/login",function(request,result)
    {
      var email=request.fields.email;
      var password=request.fields.password;

      database.collection("users").findOne({
        "email":email //first check email exist or not
      },function(error,user)
      {
        if(user==null) // if not exist
        {
          result.json({
            "status":"error",
            "message":"Email does not exist"
          });

        } else { //if exist then check password
          bcrypt.compare(password,user.password,function(error,isVerified)
          {
            if (isVerified) // password correct or not
            {
              //if correct generate web access token using jwt
              var accesstoken = jwt.sign({email : email},accessTokenSceret);
              database.collection("users").findOneAndUpdate({
                "email":email
              },{
                  $set:
                  {
                    "accessToken":accesstoken
                  }

              }, function(error,data)
              {
                result.json({
                  "status":"success",
                  "message":"Login Successfully",
                  "accessToken":accesstoken,
                  "profileImage":user.profileImage
                });
              });
            } else{
              result.json(
                {
                  "status":"error",
                  "message": "Password incorrect"

                }
              );
            }
          });
        }
      });
    });//post login request ended here
  

    //get forget password
  app.get("/forgetPassword",function(req,res)
  {
    res.render("forgetPassword")

  });
  //get forgetPassword ended
  
  //post request forgetpassword

  app.post("/forgetPassword",function(request,result)
  {
    var email=request.fields.email;

    database.collection("users").findOne(
      {"email":email
    },function(error,user)
    {
      if (user==null)
      {
        result.json({
          "status":"error",
          "message":"Email does not exist"
        });

      } else{
            crypto.randomBytes(32,function(error,buffer)
            {
              if(error)
              {
                console.log(error);
              }
              else{
                const token=buffer.toString("hex");
                database.collection("users").findOneAndUpdate({
                  "email":email
                },{
                    $set:
                    {
                      "resetToken":token,
                      "expireToken":(Date.now()+3600000).toString()
                    }
  
                }, function(error,data)
                {
                  transporter.sendMail(
                    {
                      from: "kcloczzxejedeesblf@kiabws.com",
                      to: `${email}`,
                      subject:"Reset Password",
                      html:`<p>You requested for password reset</p>
                      <h4>click on this <a href="${mainURL}/reset/${token}">link</a> to reset password</h4>`
                    });

                  result.json(
                    {
                      "status":"success",
                      "message":"Check your email for reset link"
                    });
                });
              }
            });
          }
        });
      });
  //post request forgetpassword ended
  
  //get updatepassword
  app.get("/reset/:token",function(request,result)
  {
    result.render("updatePassword");
  });
  //get updatepassword ended

  //post updatePassword
  app.post("/updatePassword",function(request,result)
  {
    var token=(request.fields.token).slice(7);
    
    var password=request.fields.password;
    database.collection("users").findOne({
      "resetToken":token
    },function(error,user)
    {
      if(user==null)
      {
        result.json(
          {
            "status":"error",
            "message":"Reset link is invalid"
          });
      }else{
        var expireToken=parseInt(user.expireToken);
        var timetillnow=Date.now();
        if((timetillnow-expireToken)>3600000)
        {
          result.json(
            {
              "status":"error",
              "message":"Link is expired"
            });
        }
        else{
          bcrypt.hash(password,10,function(error,hash){
          database.collection("users").findOneAndUpdate({
            "resetToken":token
          },{
            $set:{
              "password":hash
            }
          },function(error,data)
          {
            result.json(
              {
                "status":"success",
                "message":"Password Updated"
              });
          }
          )
        });
      }
      }
    }
    
    );



  });
  //post updatePassword ended


  //get updateProfile started
  app.get("/updateProfile",function(request,result)
  {
    result.render("updateProfile");
  });
  //get updateProfile ended

  //post updateProfile started
  app.post("/updateProfile",function(request,result)
  {
    var accessToken = request.fields.accessToken;
			var name = request.fields.name;
      var dob = request.fields.dob;
      var aboutMe = request.fields.aboutMe;

      database.collection("users").findOne({"accessToken":accessToken},
      function(error,user){
        if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {
          database.collection("users").updateOne({
						"accessToken": accessToken
					}, {
						$set: {
							"name": name,
							"dob": dob,
							"aboutMe": aboutMe
						}
					}, function (error, data) {
						result.json({
							"status": "status",
							"message": "Profile has been updated."
						});
					});

        }

      });



  });
  //post updateProfile ended

  //getUser Post route ("Checking login session")  
  app.post("/getUser",function(request,result)
  {
    var accessToken = request.fields.accessToken;
    database.collection("users").findOne({
      "accessToken" : accessToken
    },function(error,user)
    {
      if (user==null)
      {
        result.json({
          "status":"error",
          "message":"User has been logged out. Please login again."
        });
      } else {
        result.json({
          "status":"success",
          "message":"Record has been fetched",
          "data":user
        });
      }
    });
  });


  //post route for displaying image
  app.post("/uploadProfileImage", function (request, result) {
    var accessToken = request.fields.accessToken;
    
    var profileImage = "";

    database.collection("users").findOne({
      "accessToken": accessToken
    }, function (error, user) {
      if (user == null) {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        // console.log(request.files.profileImage);

        if (request.files.profileImage.size > 0 && request.files.profileImage.type.includes("image")) {

          if (user.profileImage != "public/icons/user.svg") {
            fileSystem.unlink(user.profileImage, function (error) {
              //
            });
          }
          cloudinary.uploader.upload(request.files.profileImage.path,function(err,res){
            console.log(res.url);
            profileImage=res.url;
            database.collection("users").updateOne({
              "accessToken": accessToken
            }, {
              $set: {
                "profileImage": profileImage
              }
            }, function (error, data) {
              result.json({
                "status": "status",
                "message": "Profile image has been updated.",
                "data": profileImage
              });
            });
          });
          // profileImage = "public/image/" + new Date().getTime() + "-" + request.files.profileImage.name;
          // fileSystem.rename(request.files.profileImage.path, profileImage, function (error) {
          //   //
          // });
          
          // database.collection("users").updateOne({
          //   "accessToken": accessToken
          // }, {
          //   $set: {
          //     "profileImage": profileImage
          //   }
          // }, function (error, data) {
          //   result.json({
          //     "status": "status",
          //     "message": "Profile image has been updated.",
          //     "data": profileImage
          //   });
          // });
        } else {
          result.json({
            "status": "error",
            "message": "Please select valid image."
          });
        }
      }
    });
  });

  //get home route
  app.get("/home",function(req,res){
    res.render("home");
  });



  //post route to addPost
  app.post("/addPost",function(request,result)
  {
    var accessToken=request.fields.accessToken;
    var caption=request.fields.caption;
    var image="";
    var video="";
    var type=request.fields.type;
    var createdAt=new Date().getTime();
    var _id=request.fields._id;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user)
    {
      if (user == null) {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
          cloudinary.uploader.upload(request.files.image.path,function(err,res){
            console.log(res);
            image=res.url;
            database.collection("posts").insertOne({
              "caption": caption,
              "image": image,
              "video": video,
              "type": type,
              "createdAt": createdAt,
              "likers": [],
              "comments": [],
              "shares": [],
              "user": {
                "_id": user._id,
                "name": user.name,
                "username": user.username,
                
              }
            }, function (error, data) {
    
              database.collection("users").updateOne({
                "accessToken": accessToken
              }, {
                $push: {
                  "posts": {
                    "_id": data.insertedId,
                    "caption": caption,
                    "image": image,
                    "video": video,
                    "type": type,
                    "createdAt": createdAt,
                    "likers": [],
                    "comments": [],
                    "shares": []
                  }
                }
              }, function (error, data) {
    
                result.json({
                  "status": "success",
                  "message": "Post has been uploaded."
                });
              });
            });
    
          });
          // image = "public/image/" + new Date().getTime() + "-" + request.files.image.name;
          // fileSystem.rename(request.files.image.path, image, function (error) {
          //   //
          // });
        }

        if (request.files.video.size > 0 && request.files.video.type.includes("video")) {
          cloudinary.uploader.upload(request.files.video.path,function(err,res){
            console.log(res);
            video=res.url;
            database.collection("posts").insertOne({
              "caption": caption,
              "image": image,
              "video": video,
              "type": type,
              "createdAt": createdAt,
              "likers": [],
              "comments": [],
              "shares": [],
              "user": {
                "_id": user._id,
                "name": user.name,
                "username": user.username,
                
              }
            }, function (error, data) {
    
              database.collection("users").updateOne({
                "accessToken": accessToken
              }, {
                $push: {
                  "posts": {
                    "_id": data.insertedId,
                    "caption": caption,
                    "image": image,
                    "video": video,
                    "type": type,
                    "createdAt": createdAt,
                    "likers": [],
                    "comments": [],
                    "shares": []
                  }
                }
              }, function (error, data) {
    
                result.json({
                  "status": "success",
                  "message": "Post has been uploaded."
                });
              });
            });
    
          });

          // video = "public/videos/" + new Date().getTime() + "-" + request.files.video.name;
          // fileSystem.rename(request.files.video.path, video, function (error) {
          //   //
          // });
        }

        // database.collection("posts").insertOne({
        //   "caption": caption,
        //   "image": image,
        //   "video": video,
        //   "type": type,
        //   "createdAt": createdAt,
        //   "likers": [],
        //   "comments": [],
        //   "shares": [],
        //   "user": {
        //     "_id": user._id,
        //     "name": user.name,
        //     "username": user.username,
            
        //   }
        // }, function (error, data) {

        //   database.collection("users").updateOne({
        //     "accessToken": accessToken
        //   }, {
        //     $push: {
        //       "posts": {
        //         "_id": data.insertedId,
        //         "caption": caption,
        //         "image": image,
        //         "video": video,
        //         "type": type,
        //         "createdAt": createdAt,
        //         "likers": [],
        //         "comments": [],
        //         "shares": []
        //       }
        //     }
        //   }, function (error, data) {

        //     result.json({
        //       "status": "success",
        //       "message": "Post has been uploaded."
        //     });
        //   });
        // });


      }


    });

  });



  app.post("/getNewsfeed",function(request,result){
    var accessToken = request.fields.accessToken;
    database.collection("users").findOne({
      "accessToken": accessToken
    },function(error,user){
      if (user == null) {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        var ids = [];
        ids.push(user._id);
        for(var i=0;i<user.friends.length;i++)
        {
          var friend=user.friends[i];
          if(friend.status=="Accepted"){
            ids.push(friend._id);
          }
        }
        database.collection("posts")
					.find({
						"user._id": {
							$in: ids
						}
					})
					.sort({
						"createdAt": -1
					})
					
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});  
      }
    });
  });

  app.post("/toggleLikePost", function (request, result) {

    var accessToken = request.fields.accessToken;
    var _id = request.fields._id;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user){
      if(user==null)
      {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        database.collection("posts").findOne({
          "_id": ObjectId(_id)
        },function(error,post){
          if(post==null)
          {
            result.json({
              "status": "error",
              "message": "Post does not exist."
            });
          } else {
            var isLiked = false;
							for (var a = 0; a < post.likers.length; a++) {
								var liker = post.likers[a];

								if (liker._id.toString() == user._id.toString()) {
									isLiked = true;
									break;
								}
              }
              
              if(isLiked)
              {
                database.collection("posts").updateOne({
									"_id": ObjectId(_id)
								}, {
									$pull: {
										"likers": {
											"_id": user._id,
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										$and: [{
											"_id": post.user._id
										}, {
											"posts._id": post._id
										}]
									}, {
										$pull: {
											"posts.$[].likers": {
												"_id": user._id,
											}
										}
									});

									result.json({
										"status": "unliked",
										"message": "Post has been unliked."
									});
								});
              } else {
                database.collection("users").updateOne({
									"_id": post.user._id
								}, {
									$push: {
										"notifications": {
											"_id": ObjectId(),
											"type": "photo_liked",
											"content": user.name + " has liked your post.",
											
											"isRead": false,
											"post": {
												"_id": post._id
											},
											"createdAt": new Date().getTime()
										}
									}
                });
                
                database.collection("posts").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"likers": {
											"_id": user._id,
											"name": user.name,
											
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										$and: [{
											"_id": post.user._id
										}, {
											"posts._id": post._id
										}]
									}, {
										$push: {
											"posts.$[].likers": {
												"_id": user._id,
												"name": user.name,
												
											}
										}
									});

									result.json({
										"status": "success",
										"message": "Post has been liked."
									});
								});

              }

          }

        });

      }
    });

  });


  app.post("/postComment",function(request,result){
    var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			var createdAt = new Date().getTime();

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("posts").findOne({
						"_id": ObjectId(_id)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Post does not exist."
							});
						} else {

							var commentId = ObjectId();

							database.collection("posts").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"comments": {
										"_id": commentId,
										"user": {
											"_id": user._id,
                      "name": user.name,
                      "username":user.username,
											
										},
										"comment": comment,
										"createdAt": createdAt,
										"replies": []
									}
								}
							}, function (error, data) {

								if (user._id.toString() != post.user._id.toString()) {
									database.collection("users").updateOne({
										"_id": post.user._id
									}, {
										$push: {
											"notifications": {
												"_id": ObjectId(),
												"type": "new_comment",
                        "content": user.name + " commented on your post.",
                        "username":user.username,
												
												"post": {
													"_id": post._id
												},
												"isRead": false,
												"createdAt": new Date().getTime()
											}
										}
									});
								}

								database.collection("users").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"posts._id": post._id
									}]
								}, {
									$push: {
										"posts.$[].comments": {
											"_id": commentId,
											"user": {
                        "_id": user._id,
                        "username":user.username,
												"name": user.name,
												
											},
											"comment": comment,
											"createdAt": createdAt,
											"replies": []
										}
									}
								});

								database.collection("posts").findOne({
									"_id": ObjectId(_id)
								}, function (error, updatePost) {
									result.json({
										"status": "success",
										"message": "Comment has been posted.",
										"updatePost": updatePost
									});
								});
							});

						}
					});
				}
			});

  });

  app.post("/postReply",function(request,result){
    var accessToken = request.fields.accessToken;
			var postId = request.fields.postId;
			var commentId = request.fields.commentId;
			var reply = request.fields.reply;
			var createdAt = new Date().getTime();

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					database.collection("posts").findOne({
						"_id": ObjectId(postId)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Post does not exist."
							});
						} else {

							var replyId = ObjectId();

							database.collection("posts").updateOne({
								$and: [{
									"_id": ObjectId(postId)
								}, {
									"comments._id": ObjectId(commentId)
								}]
							}, {
								$push: {
									"comments.$.replies": {
										"_id": replyId,
										"user": {
                      "_id": user._id,
                      "username":user.username,
											"name": user.name,
											
										},
										"reply": reply,
										"createdAt": createdAt
									}
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"posts._id": post._id
									}, {
										"posts.comments._id": ObjectId(commentId)
									}]
								}, {
									$push: {
										"posts.$[].comments.$[].replies": {
											"_id": replyId,
											"user": {
                        "_id": user._id,
                        "username":user.username,
												"name": user.name,
												
											},
											"reply": reply,
											"createdAt": createdAt
										}
									}
								});

								database.collection("posts").findOne({
									"_id": ObjectId(postId)
								}, function (error, updatePost) {
									result.json({
										"status": "success",
										"message": "Reply has been posted.",
										"updatePost": updatePost
									});
								});
							});

						}
					});
				}
			});


  });

  app.post("/sharePost",function(request,result){

    var accessToken = request.fields.accessToken;
		var _id = request.fields._id;
		var type = "shared";
    var createdAt = new Date().getTime();

    database.collection("users").findOne({
      "accessToken": accessToken
    },function(error,user){
      if (user == null) {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        database.collection("posts").findOne({
          "_id": ObjectId(_id)
        },function(error,post){
          if (post == null) {
            result.json({
              "status": "error",
              "message": "Post does not exist."
            });
          } else {
            database.collection("posts").updateOne({
              "_id": ObjectId(_id)
            },{
              $push: {
                "shares": {
                  "_id": user._id,
                  "name": user.name,
                  "username":user.username,
                  
                }
              }
            },function(error,data){
              database.collection("posts").insertOne({"caption": post.caption,
              "image": post.image,
              "video": post.video,
              "type": type,
              "createdAt": createdAt,
              "likers": [],
              "comments": [],
              "shares": [],
              "user": {
                "_id": user._id,
                "name": user.name,
                "username":user.username,
                
              }},function(error,data){
                database.collection("users").updateOne({
                  $and: [{
                    "_id": post.user._id
                  }, {
                    "posts._id": post._id
                  }]
                }, {
                  $push: {
                    "posts.$[].shares": {
                      "_id": user._id,
                      "name": user.name,
                      "username": user.username,
                      
                    }
                  }
                });

                result.json({
                  "status": "success",
                  "message": "Post has been shared."
                });
              });
            });
          }
        });
      }


    });
    
    
  });


  app.post("/getProfileImage",function(request,result){
    var accessToken = request.fields.accessToken;
    var id = request.fields.userid;

    database.collection("users").findOne({
      "accessToken": accessToken
    },function(error,user){
      if (user == null) {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        database.collection("users").findOne({
          "_id":ObjectId(id)
        },function(error,user3){
          if (user3 == null) {
            result.json({
              "status": "error",
              "message": "User profile not found"
            });
          } else {
            result.json({
              "status": "success",
              "profileimage":user3.profileImage
            }); 
          }
        });
      }

      

    });
    
  });


  app.post("/deletePost",function(request,result){
    var accessToken = request.fields.accessToken;
    var _id = request.fields._id;
    
    database.collection("users").findOne({
      "accessToken": accessToken
    },function(error,user){
      if (user == null) {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        database.collection("posts").findOne({
          "_id": ObjectId(_id)
        },function(error,post){
          if (post == null) {
            result.json({
              "status": "error",
              "message": "Post does not exist."
            });
          } else {
            if(post.image !="")
            {
              fileSystem.unlink(post.image,function(error){//
              });
            }
            if(post.video != "")
            {
              fileSystem.unlink(post.video,function(error){
                //
              });
            }
            database.collection("posts").deleteOne({
              "_id": ObjectId(_id)
            },function(error,data){
              database.collection("users").updateOne({
                $and: [{
                  "_id": post.user._id
                }, {
                  "posts._id": post._id
                }]
              },{
                $pull: {
                  "posts": {
                    "_id": post._id,
                  }
                }
              });
              result.json({
                "status": "success",
                "message": "Post has been deleted."
              });
            });
          }

        });
      }
      
    });

  });



  app.get("/search/:query",function(request,result){

    var query=request.params.query;
    result.render("search",{"query":query});
  });


  app.post("/search", function (request, result) {
    var query = request.fields.query;
    database.collection("users").find({
      "name": {
        $regex: ".*" + query + ".*",
        $options: "i"
      }
    }).toArray(function (error, data) {

      result.json({
        "status": "success",
        "message": "Record has been fetched",
        "data": data
      });
    });
  });



  app.post("/sendFriendRequest",function(request,result){
    var accessToken=request.fields.accessToken;
    var _id=request.fields._id;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user){
      if(user==null)
      {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        var me=user;
        database.collection("users").findOne({
          "_id":ObjectId(_id)
        },function(error,user){
          if(user == null)
          {
            result.json({
              "status": "error",
              "message": "User does not exist. "
            });

          } else {
            database.collection("users").updateOne({
              "_id":ObjectId(_id)
            },{
              $push:{
                "friends":{
                  "_id":me._id,
                  "name":me.name,
                  "username":me.username,
                  "status":"Pending",
                  "sentByMe": false,
                  "inbox":[]
                }
                
               
              }
              
            },function(error,data){

              database.collection("users").updateOne({
                "_id":ObjectId(_id)
              },{
                $push:{
                  "notifications":{
                    "_id":ObjectId(),
                    "type":"friend_request",
                    "senders_id":me._id,
                    "content":me.username+" sent you friend request. ",
                    "createdAt": new Date().getTime()
                  }
                }
                
              });




              database.collection("users").updateOne({
                "_id":me._id
              },{
                $push:{
                  "friends":{
                    "_id":user._id,
                    "name":user.name,
                    "username":user.username,
                    "status":"Pending",
                    "sentByMe": true,
                    "inbox":[]
                  }
                }

              },function(error,data){
                result.json({
                  "status": "success",
                  "message": "Friend request Sent !"
                });
              });

            });
          }
        });
      }
    });


  });


  app.get("/friends",function(req,res){
    res.render("friends");
  });



  app.post("/acceptFriendrequest",function(request,result){
    var _id= request.fields._id;
    var accessToken=request.fields.accessToken;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user){
      if(user == null)
      {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        var me=user;
        database.collection("users").findOne({
          "_id":ObjectId(_id)
        },function(error,user){
          if(user == null)
          {
            result.json({
              "status": "error",
              "message": "User does not exist."
            });
          } else {
            database.collection("users").updateOne({
              "_id":ObjectId(_id)
            },{
              $push:{
                "notifications":{
                  "_id":ObjectId(),
                  "type":"friend_request_accepted",
                  "content":me.username+" accepted your friend request ",
                  "createdAt": new Date().getTime()
                }
              }
            });
            database.collection("users").updateOne({
              $and:[
                {
                  "_id":ObjectId(_id)
                },{
                  "friends._id":me._id
                }
              ]
            },{
              $set:{
                "friends.$.status":"Accepted"
              }
            },function(error,data){
              database.collection("users").updateOne({
                $and:[
                  {
                    "_id":me._id
                  },{
                    "friends._id":user._id
                  }
                ]
              },{
                $set:{
                  "friends.$.status":"Accepted"
                }
              },function(error,data){
                result.json({
                  "status": "success",
                  "message": "Friend Request Accepted !"
                });
              });
            });


          }
        });
      }
    });


  });



  app.post("/unfriend",function(request,result){

    
    var _id= request.fields._id;
    var accessToken=request.fields.accessToken;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user){
      if(user == null)
      {
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        var me=user;
        database.collection("users").findOne({
          "_id":ObjectId(_id)
        },function(error,user){
          if(user == null)
          {
            result.json({
              "status": "error",
              "message": "User does not exist."
            });
          } else {
            database.collection("users").updateOne({
              "_id":ObjectId(_id)
            },{
              $pull:{
                "friends":{
                  "_id":me._id
                }
              }
            },function(error,data){
              database.collection("users").updateOne({
                    "_id":me._id
              },{
                $pull:{
                  "friends":{
                    "_id":user._id
                  }
                }
              },function(error,data){
                result.json({
                  "status": "success",
                  "message": "Friend has been removed !"
                });
              });
            });


          }
        });
      }


  });
});


  app.get("/user/:username",function(request,result){
    var username=request.params.username;
    result.render("profile",{"username":username});
  });


  app.post("/getUserProfile",function(request,result){
    var username=request.fields.username;
    var accessToken=request.fields.accessToken;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,loggedUser){
      if(loggedUser==null){
        result.json({
          "status": "error",
          "message": "User has been logged out. Please login again."
        });
      } else {
        if(loggedUser.username==username){
          result.json({
            "status": "success",
            "message": "This is loggedin user",
            "ownerProfile":true,
            "isFriend":false,
            "otherUser":false,
            "data":loggedUser
          });
        } else {
          database.collection("users").findOne({
            "username":username
          },function(error,user){
            if(user==null){
              result.json({
                "status": "error",
                "message": "User does not exist."
              });
            } else {
              database.collection("users").findOne({
                $and:[
                  {
                    "username":loggedUser.username
                  },{
                    "friends.username":username
                  }
                ]
              },function(error,userInFriend){
                if(userInFriend==null){
                  result.json({
                    "status": "success",
                    "message": "This is other user",
                    "ownerProfile":false,
                    "isFriend":false,
                    "otherUser":true,
                    "data":user
                  });
                } else {
                  result.json({
                    "status": "success",
                    "message": "This is friend of user",
                    "ownerProfile":false,
                    "isFriend":true,
                    "otherUser":false,
                    "data":user
                  });
                }

              });

            }

          });



        }
      }
    });

  });

  app.get("/messages",function(req,res){
    res.render("messages");
  });


  app.get("/messages/:username/:id",function(request,result){
    var username=request.params.username;
    var id=request.params.id;
    result.render("messageFriend",{"username":username,
  "id":id});
  })


  app.get("/notifications",function(req,res){
    res.render("notifications");
  });

  app.post("/getnotifications",function(request,result){
    var accessToken=request.fields.accessToken;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user){
      if(user==null)
      { 
        result.json({
          "status":"error",
          "message":"User has been logged out. Please login in again. "
        });

      } else {
        
          result.json({
            "status":"success",
            "message":"Notifications have been fetched !",
            "data":user.notifications
          });
       

      }

    });
  });


  app.post("/getPreviousChat",function(request,result){

    var otherUserid=request.fields._id;
    var accessToken = request.fields.accessToken;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,loggeduser){
      if(loggeduser==null){
        result.json({
          "status":"error",
          "message":"User has been Logged out . Please login again "
        });
      } else {
        var index=loggeduser.friends.findIndex(function(friend){
          return friend._id==otherUserid
        });

        var inbox=loggeduser.friends[index].inbox;
        result.json({
          "status":"success",
          "message":"Record has been fetched ! ",
          "data":inbox
        });

      }

    });
  });


  app.post("/sendMessage",function(request,result){
    var otherUserid=request.fields._id;
    var accessToken= request.fields.accessToken;
    var message=request.fields.message;
    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,loggeduser){
      if(loggeduser==null)
      {
        result.json({
          "status":"error",
          "message":"User has been logged out. Please login again !"
        });
      } else {
        var me=loggeduser;
        database.collection("users").findOne({
          "_id":ObjectId(otherUserid)
        },function(error,otheruser){
          if(otheruser==null){
            result.json({
              "status":"error",
              "message":"User does not exist!"
            });
          } else {
            database.collection("users").updateOne({
              $and:[
                {
                  "_id":ObjectId(otherUserid)
                },{
                  "friends._id":me._id
                }
              ]
            },{
              $push:{
                "friends.$.inbox":{
                  "_id":ObjectId(),
                  "message":message,
                  "from":me._id

                }
              }
            },function(error,data){
              database.collection("users").updateOne({
                $and:[
                  {
                    "_id":me._id
                  },{
                    "friends._id":otheruser._id
                  }
                ]
              },{
                $push:{
                  "friends.$.inbox":{
                    "_id":ObjectId(),
                    "message":message,
                    "from":me._id
  
                  }
                }

              },function(error,data){
                socketIO.to(users[otheruser._id]).emit("messageReceived",{
                  "message":message,
                  "from":me._id
                });

                result.json({
                  "status":"success",
                  "message":"Message has been sent"
                });

              });


            });

          }

        });
      }
    });
  });


  app.post("/connectSocket",function(request,result){
    var accessToken=request.fields.accessToken;

    database.collection("users").findOne({
      "accessToken":accessToken
    },function(error,user){
        if(user==null){
          result.json({
            "status":"error",
            "message":"User has been Logged out . Please Login again !"
          });
        } else {
          users[user._id]=socketID;
          result.json({
            "status":"success",
            "message":"User has been connect"
          });
        }

    });

  })



  });
});



