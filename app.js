var express = require("express");
var app = express();

var formidable=require("express-formidable");
app.use(formidable());



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






app.set('view engine', 'ejs');


app.use("/public",express.static(__dirname+"/public"));


var socketIO=require("socket.io")(http);
var socketId="";
var users=[];

var mianURL="https://localhost:3000";

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


    app.get("/signup",function(req,res){
    res.render("signup")
  });

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
              "posts":[]
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
  

    app.get("/",function(req,res)
    {
      res.redirect("/login");
    
    });
    
    
    app.get("/login",function(request,result)
    {
    
      result.render("login");
    });

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
    });//post request ended here
  
  
  
  
  
  
  });
});




