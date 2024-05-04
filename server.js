const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const database = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'main'

})

app.post('/register',(req ,res)=>{
    const sql = "INSERT INTO users(`name`,`password`,`email`,`phone`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.password,
        req.body.email,
        req.body.phone
    ];
    database.query(sql,[values],(err,data)=>{
        if(err){
            return res.json("Error");
        }else{
            return res.json(data);
        }
    });
})

app.post('/login',(req ,res)=>{
    const sql = "SELECT * FROM users WHERE `email`= ? AND `password` = ?";
    database.query(sql,[req.body.email,req.body.password],(err,data)=>{
        if(err){
            return res.json("Error");
        }
        if(data.length > 0){
            return res.json("Success");
        }else{
            return res.json("Faile");
        }
    });
})

app.listen(8081,()=>{
    console.log("listning");
})