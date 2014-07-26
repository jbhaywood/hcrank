'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var errorHandler = require('errorHandler');
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');
var routes = require('./app/routes');
var Q = require('q');

dbProvider.initialize();
cardProvider.initialize().done(function() {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Resetting card ranks.');
        cardProvider.resetCardRanks();
    } else {
        console.log('Using existing card ranks.');
    }

    var app = express();
    var router = express.Router();
    var port = process.env.PORT || 3000;

    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use('/api', router);

    if (process.env.NODE_ENV !== 'production') {
        app.use(morgan('combined'));
        app.use(errorHandler());
    }

    routes.initialize(router);

    app.listen(port);
});

var gracefulExit = function() {
    var promise = dbProvider.shutDown();
    promise.onFulfill(function() {
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

