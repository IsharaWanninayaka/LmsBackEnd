const express = require('express');
const app = express();
const router = express.Router();
const mysql = require('mysql');
const nodemailer = require('nodemailer');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
app.use(express.json());
const db = require('../main/db');
const authenticateToken = require('../main/authmiddlware');

//registration with send email
router.post('/',async(req ,res)=>{
    const { name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password.toString(), 4);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
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
                        user:process.env.from_email, 
                        pass:process.env.email_password 
                    }
                });
                let mailOptions = {
                    from: process.env.from_email,
                    to: email, 
                    subject: 'GenZeIctClass',
                    text: `Hi! There, Please follow the given link to verify your email 
                    http://localhost:8081/user/verify/${verificationToken}  Thanks`  
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
    await db.query('SELECT * FROM users WHERE email = ?',[email],async(err,result)=>{
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
        res.json({ token, loginSuccses :'Sucsess' });
    });

});

router.get('/userAccount',authenticateToken,(req,res)=>{
        
        db.query('SELECT name,email,phone FROM users WHERE id = ?',[req.user.id],(err,result)=>{
            if(err) return res.json({err:err});
            res.json(result[0]);
        });
    });

module.exports = router;