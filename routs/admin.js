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

module.exports = router;