// File: index.js
// Description: main routing module, handles general routing

const bodyParser = require("body-parser");
const express = require('express');
const path = require('path');
const app = express();

//app.use('/comment', require('./comment'));
//app.use('/course', require('./course'));
app.use('/plan', require('./plan'));
//app.use('/user', require('./user'));

// parse request bodies as JSON
app.use(bodyParser.json());

// statically serve files from the public directory
app.use(express.static("views/public"));

// everything else gets a 404 error
app.get("*", (req, res) => {
  res.status(404).send("Not found");
});

module.exports = app;
