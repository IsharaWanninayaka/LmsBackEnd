const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const session = require('express-session');
require('dotenv').config();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieparser = require('cookie-parser');
const cors = require('cors');
const db = require('../main/db');
const authenticateToken = require('../main/authmiddlware');
//registration with send email

router.use(cors({
    origin:['http://localhost:3000'],
    credentials: true
}));

router.use(express.json());
router.use(cookieparser());
/*router.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized:true,
    cookie: {
        secure:false,
        sameSite: 'None',
        maxAge: 1000 * 60 * 60 *24
    }
}));*/

router.post('/',async(req ,res)=>{
    const { name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password.toString(), 4);
    const verificationToken = jwt.sign({ email },process.env.JWT_SECRET, { expiresIn: '1d' });
    
    const isMailinDb = ()=>{
        return new Promise ((resolve,reject)=>{
            db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
               if(err){
                reject(err);
               }else{
                resolve(results);
               }
        });
    });
    }

    isMailinDb().then((data)=>{
        if(data.length>0) return res.status(400).json({ message: 'User already exists' });
        else{
            db.query('INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)', 
            [name, phone, email, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(400).json({err:err});
                }
  
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.from_email, 
                        pass: process.env.email_password,
                    }
                });
                let mailOptions = {
                    from: process.env.from_email,
                    to: email, 
                    subject: 'MasterArt',
                    text: `Hi! There, Please follow the given link to verify your email 
                    http://localhost:5000/user/verify/${verificationToken}  Thanks`  
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    res.status(201).json({ message: 'Registration successful, please check your email to verify your account' });
                });
            });
        }
    })

    .catch((err)=>{
            console.log(err);
    })
});

//verify email
router.get('/verify/:token',(req, res) => {
    const { token } = req.params;
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        db.query('UPDATE users SET verified = TRUE WHERE email = ?',[decoded.email],(err,result) => {
            if(err) return res.json({err: err});
            res.send('Email verified successfully');
        });
    });

});

//login user
router.post('/login',async(req,res)=>{
    const { email, password } = req.body;
        db.query('SELECT * FROM users WHERE email = ?',[email],async(err,result)=>{
        if(err) res.json({err:err});
        if(result.length === 0){
            return res.status(400).json({ message: 'User not found' });
        }
        if(result[0].verified === 0){
            return res.status(400).json({ message: 'Verify email first' });
        }
        const isMatchPsw = await bcrypt.compare(password.toString(), result[0].password);
        if(!isMatchPsw) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        //req.session.userid = result[0].userId;
        res.cookie('token',token);
        res.json({ login:'Sucsess' });
    });

});

router.get('/Account', authenticateToken, (req, res) => {
  db.query('SELECT name, email, phone ,imageUrl FROM users WHERE id = ?', [req.user.id], (err, result) => {
    if (err) {
      console.error('Fetch user data error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result[0]);
    console.log(result[0]);
  });
});

router.get('/logout',(req,res) => {
    res.clearCookie('token');
    return res.json({status :'success'});
});

module.exports = router;