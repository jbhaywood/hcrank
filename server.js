'use strict';
var http = require('http');
var path = require('path');
var express = require('express');
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');

dbProvider.initialize();
cardProvider.initialize();

var app = express();
var server = http.createServer(app);

app.use('/', express.static(path.resolve(__dirname, 'public')));
app.use('/', express.json());
app.use('/', express.urlencoded());

server.listen(process.env.PORT || 3000, function(){
    var addr = server.address();
    console.log('Server listening at', addr.address + ':' + addr.port);
});
    
var gracefulExit = function() {
    var promise = dbProvider.shutDown();
    promise.onFulfill(function() {
        process.exit(0);
    });
};

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

app.post('/api/newmatchup/', function(req, res) {
    var data = req.body;
    var cardData = cardProvider.getTwoRandomNeutralCards(data.manaSkip);
    var sendData = {
        cardOne: {
            id: cardData.cardOne.id,
            url: cardData.cardOne.image_url,
            neutralRank: cardData.cardOne.neutralRank
        },
        cardTwo: {
            id: cardData.cardTwo.id,
            url: cardData.cardTwo.image_url,
            neutralRank: cardData.cardTwo.neutralRank
        },
        mana:cardData.mana
    };
    res.send(sendData);
});

app.post('/api/savematchup/', function(req) {
    var data = req.body;
    var idOne = parseInt(data.cardOne.id);
    var idTwo = parseInt(data.cardTwo.id);
    var rankOne = parseFloat(data.cardOne.neutralRank);
    var rankTwo = parseFloat(data.cardTwo.neutralRank);
    var milliseconds = parseInt(data.milliseconds);
    cardProvider.setNeutralRank(idOne, rankOne);
    cardProvider.setNeutralRank(idTwo, rankTwo);
    dbProvider.saveMatchup(idOne, idTwo, idOne, milliseconds);
});