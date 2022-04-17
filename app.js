//jshint esversion:6
require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose');
const ejs = require('ejs');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { listen } = require('express/lib/application');
const { hash } = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();
app.use(express.json());
app.set('view engine' , ejs);
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret : 'my secret .',
    resave : false,
    saveUninitialized :  false
}));

app.use(passport.initialize());
app.use(passport.session()); 

mongoose.connect('mongodb://localhost:27017/secretdb', {
    useNewUrlParser : true
}).then(()=>{
    console.log('sucessfully connected...to mongodb');
});

const userSchema =new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret : String

})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL :'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google' ,
    passport.authenticate('google',{scope :['profile']}) )

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  })
app.get('/',function(req,res){
    res.render('home.ejs');
})
app.get('/login' , function(req,res){
    res.render('login.ejs');
})

app.get('/register',(req,res)=>{
    res.render('register.ejs');
})

app.get('/secrets' , function(req,res){
   User.find({secret : {$ne : null}},function(err,secrets){
       if(err) console.log(err);
       else{
           res.render('secrets.ejs',{userWithSecret : secrets})
       }

   })
    
})

app.get('/submit' ,(req,res)=>{
    if(req.isAuthenticated()){
        res.render('submit.ejs');

    }else{
        res.redirect('/login');
    } 
})

app.post('/submit' ,(req,res)=>{
const submittedSecret = req.body.secret;
console.log(submittedSecret);
console.log(req.user.id);
User.findById(req.user.id , function(err , founduser){
    if(err) console.log(err);
    else{
        console.log(founduser);
        founduser.secret = submittedSecret
        founduser.save(function(){
            res.redirect('/secrets')
        })
    }
})

})

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/')
})


app.post('/register' ,(req,res)=>{

    User.register({username : req.body.username}, req.body.password,(err , user)=>{
        if(err) {
            res.redirect('/register');
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect('/login');
            })
            
        }
    })
})



app.post('/login',(req,res)=>{
    const user = new User({
        username : req.body.username ,
        password : req.body.password
    })
    //req.login from passportjs
   req.login(user, function(err){
if(err){
    console.log(err);
}
else{
    passport.authenticate('local')(req,res,function(){
        res.redirect('/secrets');
    })
}
   } )
})

app.get('/submit',(req,res)=>{
    res.render('submit.ejs')
})

app.listen(3000 , ()=>{
    console.log(`app is running on port 3000 `);
})

