#!/usr/local/bin/node

var path = require('path'),
    logger = require('morgan'),
    express = require('express'),
    ejs = require('ejs'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser')
;

var app = express(),
    server = require('http').Server(app);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('.html', ejs.__express);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

require('./bin/socketIO')(server);
require('./routes/index')(app);


server.listen(3000, function () {
    console.log("app start at http://127.0.0.1:3000/");
});
