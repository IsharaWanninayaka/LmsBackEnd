const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'main'
});

db.connect(function(err) {
    if (err) throw err;
    console.log("connected");
});  



//registration with send email
app.post('/',async(req ,res)=>{
    const { name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password.toString(), 4);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
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
                    to: process.env.to_email, 
                    subject: 'GenZeIctClass',
                    text: `Hi! There, Please follow the given link to verify your email 
                    http://localhost:8081/verify/${verificationToken}  Thanks`  
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
app.get('/verify/:token',(req, res) => {
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
app.post('/login',async(req,res)=>{
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

app.get('/userAccount',(req,res)=>{
    const token = req.header('Authorization').replace('Bearer ', '');
    jwt.verify(token,process.env.JWT_SECRET,(err,result)=>{
        
        if(err){
            return res.status(401).json({ message: 'Unauthorized--' });
        }
        db.query('SELECT name,email,phone FROM users WHERE id = ?',[result.id],(err,result)=>{
            if(err) return res.json({err:err});
            res.json(result[0]);
            console.log(result[0]);
        });
    });
});



app.listen(8081,()=>{
    console.log("listning");
});