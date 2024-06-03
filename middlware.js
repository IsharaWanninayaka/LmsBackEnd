const bcrypt = require('bcryptjs');

const psw = 'San@1028';

const test = (psw) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(psw, 10, function(err, hash) {
            if (err) {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
};

const testing = (hash) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(psw, hash, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

test(psw).then((data) => {
    console.log(data);
    return testing(data)
    
})
.then((hh)=>{
     console.log(hh);
})
.catch((err) => {
    console.error(err);
});

