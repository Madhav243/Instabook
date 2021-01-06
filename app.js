var express = require("express");
var app = express();

var formidable=require("express-formidable");
app.use(formidable());

require('dotenv').config()

var mongodb= require("mongodb");
var mongoClient=mongodb.MongoClient;
var ObjectID=mongodb.ObjectId;

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
              "profileImage":"",
              "dob":"",
              "aboutMe":"",
              "follower":[],
              "following":[],
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
          database.collection("users").findOneAndUpdate({
            "resetToken":token
          },{
            $set:{
              "password":password
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
        }
      }
    }
    
    );



  });
  //post updatePassword ended











  });
});




