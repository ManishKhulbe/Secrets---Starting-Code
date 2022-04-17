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

    bcrypt.hash(req.body.password, saltRounds,(err,hash)=>{
        if(err) console.log(err);
        const newUser = new User({
            email : req.body.username,
            password : hash
        })
        newUser.save((err,data)=>{
            if(err) console.log(err);
            else{
                console.log(data);
                res.render('secrets.ejs')
            }
        });
        
    })
})


app.post('/login',(req,res)=>{
    username = req.body.username 
    password =  req.body.password

    User.find({email : username},(err,data)=>{
        if(err) console.log(err);
        else{
            bcrypt.compare(password , data[0].password,(err,data)=>{
                if(err) console.log(err);
                else{
                    if(data === true){
                        res.render('secrets.ejs')
                    }
                }
            })
            
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

