'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

var Card;
var Matchup;

var _dbServer;
var _restartOnDisconnect = true;

var getConnectionString = function(useProductionDb) {
    _dbServer = process.env.NODE_ENV === 'production' || useProductionDb ? 'hcrank' : 'test_db';
    var connectString;

    if (process.env.NODE_ENV === 'production') {
        connectString = process.env.DB_CONNECT_URI;
    } else {
        var config = require('./config/config');
        connectString = useProductionDb ? config.productionDbUri : config.testDbUri;
    }
    return connectString;
};

// PUBLIC

var initialize = function(useProductionDb) {
    var promise = new mongoose.Promise;
    var connect = function () {
        var options = { server: { socketOptions: { keepAlive: 1 } } };
        mongoose.connect(getConnectionString(useProductionDb), options);
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
        promise.fulfill();
    });

    Card = mongoose.model('Card', mongoose.Schema({
        id: Number,
        ranks: [Number],
        updated: Date,
        totalMatchups: Number,
        totalWins: Number
    }));

    Matchup = mongoose.model('Matchup', mongoose.Schema({
        cardOneId: Number,
        cardTwoId: Number,
        cardOneRank: Number,
        cardTwoRank: Number,
        winnerId: Number,
        class: String,
        secondsToDecide: Number,
        created: Date
    }));

    return promise;
};

var getCard = function(cardId) {
    return Card.findOne({ id: cardId }).exec();
};

var getCardsByIds = function(cardIds) {
    return Card.where('id').in(cardIds).exec();
};

var saveMatchup = function(cardWinnerId, cardLoserId, cardWinnerRank, cardLOserRank, winnerId, cardClass, milliseconds) {
    // always order cards by id to make looking up matchups between specific ones easier
    var id1, id2, rank1, rank2;
    if (cardWinnerId < cardLoserId) {
        id1 = cardWinnerId;
        id2 = cardLoserId;
        rank1 = cardWinnerRank;
        rank2 = cardLOserRank;
    } else {
        id1 = cardLoserId;
        id2 = cardWinnerId;
        rank1 = cardLOserRank;
        rank2 = cardWinnerRank;
    }
    var matchup = new Matchup({
        cardOneId: id1,
        cardTwoId: id2,
        cardOneRank: rank1,
        cardTwoRank: rank2,
        winnerId: winnerId,
        class: cardClass,
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
                    updated: new Date(),
                    totalMatchups: 0,
                    totalWins: 0
                });
            } else if (cardData.updated > dbCard.updated) {
                dbCard.ranks = cardData.ranks.slice();
                dbCard.updated = cardData.updated;
                dbCard.totalMatchups = cardData.totalMatchups;
                dbCard.totalWins = cardData.totalWins;
            }
            dbCard.save();
        }, function(err) {
            console.log(err);
        });
    });
};

var getNumMatchups = function(theClass) {
    var promise = new mongoose.Promise;
    Matchup.count({ }, function(err, c)
    {
        promise.fulfill(c);
    });
    return promise;
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

var deleteCards = function() {
    Card.remove({}, function(err) {
        if (err) {
            console.log('error removing card collection:' + err.message);
        } else {
            console.log('card collection removed');
        }
    }).exec();
};

var deleteMatchups = function() {
    Matchup.remove({}, function(err) {
        if (err) {
            console.log('error removing matchup collection:' + err.message);
        } else {
            console.log('matchup collection removed');
        }
    }).exec();
};

exports.initialize = initialize;
exports.deleteCards = deleteCards;
exports.deleteMatchups = deleteMatchups;
exports.getCard = getCard;
exports.getCardsByIds = getCardsByIds;
exports.getNumMatchups = getNumMatchups;
exports.saveMatchup = saveMatchup;
exports.saveUpdatedCards = saveUpdatedCards;
exports.shutDown = shutDown;