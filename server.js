'use strict';
var express = require('express');
var http = require('http');
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

