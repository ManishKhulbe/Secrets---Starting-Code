//jshint esversion:6
require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose');
const ejs = require('ejs');
var bodyParser = require('body-parser');
var encrypt = require('mongoose-encryption');
const { listen } = require('express/lib/application');

const app = express();
app.use(express.json());
app.set('view engine' , ejs);
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/secretdb', {
    useNewUrlParser : true
}).then(()=>{
    console.log('sucessfully connected...to mongodb');
});

const userSchema =new mongoose.Schema({
    email : String,
    password : String
})


userSchema.plugin(encrypt,{secret : process.env.SECRET, encryptedFields : ['password']});
const User = new mongoose.model('User', userSchema);

app.get('/',function(req,res){
    res.render('home.ejs');
})
app.get('/login' , function(req,res){
    res.render('login.ejs');
})

app.get('/register',(req,res)=>{
    res.render('register.ejs');
})

app.post('/register' ,(req,res)=>{
const newUser = new User({
    email : req.body.username,
    password : req.body.password
})
console.log(req.body.username , req.body.password , req.body);
newUser.save((err)=>{
    if(err) console.log(err);
    else{
        res.render('secrets.ejs')
    }
});
})

app.post('/login',(req,res)=>{
    username = req.body.username 
    password = req.body.password

    User.find({email : username},(err,data)=>{
        if(err) console.log(err);
        else{
            if(data[0].password === password){
                res.render('secrets.ejs')
            }
            console.log(data);
        }
    })
})

app.get('/submit',(req,res)=>{
    res.render('submit.ejs')
})

app.listen(3000 , ()=>{
    console.log(`app is running on port 3000 `);
})

