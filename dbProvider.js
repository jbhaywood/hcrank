'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

var _prodDb;
var _testDb;
var _testEnv;

var Card;
var Matchup;
var TestCard = null;
var TestMatchup = null;

var CardObj = function() {
    return {
        id: Number,
        ranks: [Number],
        updated: Date,
        matchupTotals: [Number],
        winTotals: [Number]
    };
};

var MatchupObj = function() {
    return {
        cardOneId: Number,
        cardTwoId: Number,
        cardOneRank: Number,
        cardTwoRank: Number,
        winnerId: Number,
        class: String,
        secondsToDecide: Number,
        created: Date
    };
};

var Options = function() {
    return { server: { socketOptions: { keepAlive: 1 } } };
};

var getConnectionString = function(useProductionDb) {
    var connectString;

    if (!_testEnv) {
        connectString = process.env.DB_CONNECT_URI;
    } else {
        var config = require('./config/config');
        connectString = useProductionDb ? config.productionDbUri : config.testDbUri;
    }
    return connectString;
};

var getCard = function(cardId) {
    return _testEnv ?
        TestCard.findOne({ id: cardId }).exec() :
        Card.findOne({ id: cardId }).exec();
};

// PUBLIC
var initialize = function() {
    _testEnv = process.env.NODE_ENV !== 'production';
    var promise = new mongoose.Promise;

    var prodCon = getConnectionString(true);
    _prodDb = mongoose.createConnection(prodCon, new Options());

    _prodDb.once('open', function() {
        Card = _prodDb.model('Card', mongoose.Schema(new CardObj()));
        Matchup = _prodDb.model('Matchup', mongoose.Schema(new MatchupObj()));

        console.log('Connected to ' + _prodDb.name);
        if (!_testEnv) {
            promise.fulfill();
        } else if (_testDb && _testDb._hasOpened) {
                promise.fulfill();
        }
    });

    _prodDb.on('error', function (err) {
        console.log('Error onnecting to ' + _prodDb.name + ': ' + err);
    });

    _prodDb.on('disconnected', function () {
        console.log('Mongoose connection to ' + _prodDb.name + ' disconnected');
    });

    if (_testEnv) {
        var testCon = getConnectionString(false);
        _testDb = mongoose.createConnection(testCon, new Options());

        _testDb.once('open', function() {
            TestCard = _testDb.model('TestCard', mongoose.Schema(new CardObj()));
            TestMatchup = _testDb.model('TestMatchup', mongoose.Schema(new MatchupObj()));

            console.log('Connected to ' + _testDb.name);
            if (_prodDb && _prodDb._hasOpened) {
                promise.fulfill();
            }
        });

        _testDb.on('error', function (err) {
            console.log('Error onnecting to ' + _testDb.name + ': ' + err);
        });
    }

    return promise;
};

var getCardsByIds = function(cardIds) {
    return _testEnv ?
        TestCard.where('id').in(cardIds).exec() :
        Card.where('id').in(cardIds).exec();
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

    var matchupObj = {
        cardOneId: id1,
        cardTwoId: id2,
        cardOneRank: rank1,
        cardTwoRank: rank2,
        winnerId: winnerId,
        class: cardClass,
        secondsToDecide: (milliseconds / 1000),
        created: new Date()
    };

    var matchup = _testEnv ? new TestMatchup(matchupObj) : new Matchup(matchupObj);
    matchup.save();
};

var saveUpdatedCards = function(cardDatas) {
    _.forEach(cardDatas, function(cardData) {
        getCard(cardData.id).then(function(dbCard) {
            if (!dbCard) {
                var cardObj = {
                    id: cardData.id,
                    ranks: cardData.ranks.slice(),
                    updated: new Date(),
                    matchupTotals: cardData.matchupTotals.slice(),
                    winTotals: cardData.winTotals.slice()
                };
                dbCard = _testEnv ? new TestCard(cardObj) : new Card(cardObj);
            } else if (cardData.updated > dbCard.updated) {
                dbCard.ranks = cardData.ranks.slice();
                dbCard.updated = cardData.updated;
                dbCard.matchupTotals = cardData.matchupTotals.slice();
                dbCard.winTotals = cardData.winTotals.slice();
            }
            dbCard.save();
        }, function(err) {
            console.log(err);
        });
    });
};

var getTotalMatchups = function() {
    var promise = new mongoose.Promise;
    if (_testEnv) {
        TestMatchup.count({ }, function(err, c)
        {
            promise.fulfill(c);
        });
    } else {
        Matchup.count({ }, function(err, c)
        {
            promise.fulfill(c);
        });
    }
    return promise;
};

var shutDown = function() {
    var promise = new mongoose.Promise;
    _prodDb.close(function () {
        console.log('Mongoose default connection with DB :' + _prodDb.name + ' is disconnected through app termination');
        promise.fulfill();
    });
    if (_testEnv) {
        _testDb.close(function () {
            console.log('Mongoose default connection with DB :' + _testDb.name + ' is disconnected through app termination');
            promise.fulfill();
        });
    }
    return promise;
};

var deleteCards = function() {
    if (_testEnv) {
        TestCard.remove({}, function(err) {
            if (err) {
                console.log('error removing card collection:' + err.message);
            } else {
                console.log('card collection removed');
            }
        }).exec();
    } else {
        Card.remove({}, function(err) {
            if (err) {
                console.log('error removing card collection:' + err.message);
            } else {
                console.log('card collection removed');
            }
        }).exec();
    }
};

var deleteMatchups = function() {
    if (_testEnv) {
        TestMatchup.remove({}, function(err) {
            if (err) {
                console.log('error removing matchup collection:' + err.message);
            } else {
                console.log('matchup collection removed');
            }
        }).exec();
    } else {
        Matchup.remove({}, function(err) {
            if (err) {
                console.log('error removing matchup collection:' + err.message);
            } else {
                console.log('matchup collection removed');
            }
        }).exec();
    }
};

var getDbModels = function() {
    return {
        Card: Card,
        Matchup: Matchup,
        TestCard: TestCard,
        TestMatchup: TestMatchup
    };
};

exports.initialize = initialize;
exports.deleteCards = deleteCards;
exports.deleteMatchups = deleteMatchups;
exports.getCardsByIds = getCardsByIds;
exports.getTotalMatchups = getTotalMatchups;
exports.saveMatchup = saveMatchup;
exports.saveUpdatedCards = saveUpdatedCards;
exports.shutDown = shutDown;
exports.getDbModels = getDbModels;
