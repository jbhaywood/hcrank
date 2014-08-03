'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

var Card;
var Matchup;

var _dbServer = 'test_db';
var _restartOnDisconnect = true;

var _connectUri;
var config;
if (process.env.NODE_ENV === 'production') {
    _connectUri = process.env.DB_CONNECT_URI;
} else {
    config = require('./config/config');
    _connectUri = config.dbConnectUri;
}

// PUBLIC

var initialize = function() {
    var connect = function () {
        var options = { server: { socketOptions: { keepAlive: 1 } } };
        mongoose.connect(_connectUri, options);
    };
    connect();

    mongoose.connection.on('error', function (err) {
        console.log(err);
    });

    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose connection to ' + _dbServer + ' disconnected');
        if (_restartOnDisconnect) {
             connect();
        }
    });

    mongoose.connection.on('connected', function() {
        console.log('Connected to ' + _dbServer);
    });

    Card = mongoose.model('Card', mongoose.Schema({
        id: Number,
        ranks: [Number],
        updated: Date
    }));

    Matchup = mongoose.model('Matchup', mongoose.Schema({
        cardOneId: Number,
        cardTwoId: Number,
        winnerId: Number,
        secondsToDecide: Number,
        created: Date
    }));

    // uncomment to remove all card documents
//    Card.remove({}, function(err) {
//        console.log('collection removed');
//    });
};

var getCard = function(cardId) {
    return Card.findOne({ id: cardId }).exec();
};

var getCardsByIds = function(cardIds) {
    return Card.where('id').in(cardIds).exec();
};

var saveMatchup = function(cardOneId, cardTwoId, winnerId, milliseconds) {
    // always order cards by id to make looking up matchups between specific cards easier
    var id1, id2;
    if (cardOneId < cardTwoId) {
        id1 = cardOneId;
        id2 = cardTwoId;
    } else {
        id1 = cardTwoId;
        id2 = cardOneId;
    }
    var matchup = new Matchup({
        cardOneId: id1,
        cardTwoId: id2,
        winnerId: winnerId,
        secondsToDecide: (milliseconds / 1000),
        created: new Date()
    });
    matchup.save();
};

var saveUpdatedCards = function(cardDatas) {
    _.forEach(cardDatas, function(cardData) {
        getCard(cardData.id).then(function(dbCard) {
            if (!dbCard) {
                dbCard = new Card({
                    id: cardData.id,
                    ranks: cardData.ranks.slice(),
                    updated: new Date()
                });
            } else if (cardData.updated > dbCard.updated) {
                dbCard.ranks = cardData.ranks.slice();
                dbCard.updated = cardData.updated;
            }
            dbCard.save();
        }, function(err) {
            console.log(err);
        });
    });
};

var shutDown = function() {
    var promise = new mongoose.Promise;
    _restartOnDisconnect = false;
    mongoose.connection.close(function () {
        console.log('Mongoose default connection with DB :' + _dbServer + ' is disconnected through app termination');
        promise.fulfill();
    });
    return promise;
};

exports.initialize = initialize;
exports.getCard = getCard;
exports.getCardsByIds = getCardsByIds;
exports.saveMatchup = saveMatchup;
exports.saveUpdatedCards = saveUpdatedCards;
exports.shutDown = shutDown;
