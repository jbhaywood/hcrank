'use strict';
var express = require('express');
var http = require('http');
var socket = require('socket.io');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var errorHandler = require('errorhandler');
var apiRoutes = require('./app/apiRoutes');
var cardProvider = require('./app/cardProvider');
var dbProvider = require('./app/dbProvider');

dbProvider.initialize().then(function() {
    cardProvider.initialize().done(function() {
        var app = express();
        var apiRouter = express.Router();
        var router = express.Router();
        var port = process.env.PORT || 3000;

        app.use(express.static('public'));
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use('/', router);
        app.use('/api', apiRouter);

        if (process.env.NODE_ENV !== 'production') {
            app.use(morgan('combined'));
            app.use(errorHandler());
        }

        apiRoutes.initialize(apiRouter);

        var server = app.listen(port);
        var io = socket.listen(server);

        io.on('connection', function (socket) {
            // NOTE: socket test, keep around for now
            //var sortedDatas = apiRoutes.getSortedCardDatas('neutral');
            //socket.emit('card update', { data: sortedDatas });
            //
            //setInterval(function() {
            //    var sortedDatas = apiRoutes.getSortedCardDatas('neutral');
            //    socket.emit('card update', { data: sortedDatas });
            //}, 1000);
        });
    });
});

var gracefulExit = function() {
    var promise = dbProvider.shutDown();
    promise.onFulfill(function() {
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

