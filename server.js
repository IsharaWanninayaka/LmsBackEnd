const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const user = require('./routs/user');
const admin = require('./routs/admin');
const grade10 = require('./routs/grade10');

app.use('/user',user);
app.use('/admin',admin);
app.use('/user/grade10',grade10);





app.listen(8081,()=>{
    console.log("listning");
});