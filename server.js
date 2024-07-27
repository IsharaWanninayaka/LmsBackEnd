const express = require('express');
const bodyParser = require('body-parser');
const user = require('../LmsBackEnd/routs/user');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use('/user', user);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
