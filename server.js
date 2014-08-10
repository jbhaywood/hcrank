'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var errorHandler = require('errorhandler');
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');
var apiRoutes = require('./app/apiRoutes');
var routes = require('./app/routes');

dbProvider.initialize();
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

    routes.initialize(router);
    apiRoutes.initialize(apiRouter);

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

