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


router.post('/lesson/access',authenticateToken,(req,res)=>{
    const {lesson_id} = req.body;
    console.log(lesson_id);
    db.query('SELECT * FROM paid_and_access WHERE user_id = ? AND access = ? AND lesson_id = ?',[req.user.id,1,lesson_id],(err,result)=>{
        if(err){
            return res.json({err:err});
        }if(result.length>0){
            return res.json({"access":true});
        }res.json({"access":false});
    });
});

router.post('/lesson/topics',authenticateToken,(req,res)=>{
    const {lesson_id} = req.body;
    db.query('SELECT * FROM topic WHERE lesson_id = ?',[lesson_id],(err,result)=>{
        if(err){
            return res.json({err:err});
        }
            if(result.length == 0){
                return res.json({"lenth":0});
            }return res.json({"length":result.length,result});
    });
});

module.exports = router;