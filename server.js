const express = require("express");
const mongoose = require('mongoose');
const app = express();
const router = require('./scripts/router');
var cookieParser = require('cookie-parser');
mongoose.connect('mongodb+srv://badquiz:badquiz@cluster0-mshgi.mongodb.net/BadQuiz?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(express.urlencoded({extended: true}))
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs')
app.use('/css', express.static('./static/css'))
app.use('/js', express.static('./static/js'))
app.use('/fonts', express.static('./static/fonts'))
app.use('/images', express.static('./static/images'))
app.use('/help', express.static('./static/help.html'))
app.use(router);

app.listen(3000, () => console.log("Listening on 3000"));

//module.exports = app;
