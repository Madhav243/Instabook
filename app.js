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
    api_key:process.env.SENDGRID_API_KEY
  }
  
})
);

var crypto=require("crypto");

app.set('view engine', 'ejs');

app.use("/public",express.static(__dirname+"/public"));


var socketIO=require("socket.io")(http);
var socketId="";
var users=[];

var mainURL="localhost:3000";
//main url also in header chnge  and footer alsowhile deploying

socketIO.on("connection",function(socket)
{
  console.log("User connected",socket.id);
  socketId=socket.id;

}
);

http.listen(3000, function() {
  console.log("Server started on port 3000");

  mongoClient.connect("mongodb://localhost:27017",function(error,client){
    var database=client.db("instabook");
    console.log("Database is connected");

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
                      <h4>click on this <a href="https://${mainURL}/reset/${token}">link</a> to reset password</h4>`
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

        if (request.files.profileImage.size > 0 && request.files.profileImage.type.includes("image")) {

          if (user.profileImage != "public/icons/user.svg") {
            fileSystem.unlink(user.profileImage, function (error) {
              //
            });
          }

          profileImage = "public/image/" + new Date().getTime() + "-" + request.files.profileImage.name;
          fileSystem.rename(request.files.profileImage.path, profileImage, function (error) {
            //
          });
          console.log(request.files.profileImage.path);
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
              "data": mainURL + "/" + profileImage
            });
          });
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
          image = "public/image/" + new Date().getTime() + "-" + request.files.image.name;
          fileSystem.rename(request.files.image.path, image, function (error) {
            //
          });
        }

        if (request.files.video.size > 0 && request.files.video.type.includes("video")) {
          video = "public/videos/" + new Date().getTime() + "-" + request.files.video.name;
          fileSystem.rename(request.files.video.path, video, function (error) {
            //
          });
        }

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
            "profileImage": user.profileImage
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
        database.collection("posts")
					.find({
						"user._id": {
							$in: ids
						}
					})
					.sort({
						"createdAt": -1
					})
					.limit(5)
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
											"profileImage": user.profileImage,
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
											"profileImage": user.profileImage
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
												"profileImage": user.profileImage
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




  });
});




