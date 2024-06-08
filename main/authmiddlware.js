const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req,res,next) =>{
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
    
        jwt.verify(token, process.env.JWT_SECRET, (err, result) => {
            if (err) {
                return res.status(400).json({ message: 'Invalid token.' });
            }

            req.user = result; 
            next(); 
        });
}
module.exports = authenticateToken;