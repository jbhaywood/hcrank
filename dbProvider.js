'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');

var Card;
var Matchup;

var _classList = ['druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];
var _defaultClassRanks;
var _dbServer = 'test_db';
var _restartOnDisconnect = true;

// PUBLIC

var initialize = function() {
    var connect = function () {
        var options = { server: { socketOptions: { keepAlive: 1 } } };
        mongoose.connect('mongodb://jhaywood:test_db@kahana.mongohq.com:10037/' + _dbServer, options);
    };
    connect();

    mongoose.connection.on('error', function (err) {
        console.log(err);
    });

    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection to DB :' + _dbServer + ' disconnected');
        if (_restartOnDisconnect) {
             connect();
        }
    });

    mongoose.connection.on('connected', function() {
        console.log('Connected to ' + _dbServer + ' DB!');
    });

    Card = mongoose.model('Card', mongoose.Schema({
        id: Number,
        neutralRank: Number,
        classRanks: [Number],
        updated: Date
    }));

    Matchup = mongoose.model('Matchup', mongoose.Schema({
        cardOneId: Number,
        cardTwoId: Number,
        winnerId: Number,
        secondsToDecide: Number,
        created: Date
    }));

    _defaultClassRanks = _.map(_classList, function() { return 0; });
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
exports.shutDown = shutDown;
