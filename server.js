'use strict';
var express = require('express');
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');
var routes = require('./app/routes');

dbProvider.initialize();
cardProvider.initialize();

var app = express();

app.use('/', express.static(__dirname + '/public'));
app.use('/', express.json());
app.use('/', express.urlencoded());
app.set('port', process.env.PORT || 3000);

routes.initialize(app);

app.listen(app.get('port'), function() {
    console.log('Server listening at port ' + app.get('port'));
});
    
var gracefulExit = function() {
    var promise = dbProvider.shutDown();
    promise.onFulfill(function() {
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

