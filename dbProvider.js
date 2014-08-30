'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');
var cardProvider = require('./cardProvider');

var _prodDb;
var _testDb;

var Card;
var Matchup;
var TestCard;
var TestMatchup;

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

    if (process.env.NODE_ENV === 'production') {
        connectString = process.env.DB_CONNECT_URI;
    } else {
        var config = require('./config/config');
        connectString = useProductionDb ? config.productionDbUri : config.testDbUri;
    }
    return connectString;
};

// PUBLIC
var initialize = function() {
    var promise = new mongoose.Promise;

    var prodCon = getConnectionString(true);
    _prodDb = mongoose.createConnection(prodCon, new Options());

    _prodDb.once('open', function() {
        console.log('Connected to ' + _prodDb.name);
        if (process.env.NODE_ENV === 'production') {
            promise.fulfill();
        } else if (_testDb._hasOpened) {
                promise.fulfill();
        }
    });

    _prodDb.on('error', function (err) {
        console.log('Error onnecting to ' + _prodDb.name + ': ' + err);
    });

    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose connection to ' + mongoose.connection.name + ' disconnected');
    });

    Card = _prodDb.model('Card', mongoose.Schema(new CardObj()));
    Matchup = _prodDb.model('Matchup', mongoose.Schema(new MatchupObj()));

    if (process.env.NODE_ENV !== 'production') {
        var testCon = getConnectionString(false);
        _testDb = mongoose.createConnection(testCon, new Options());

        TestCard = _testDb.model('TestCard', mongoose.Schema(new CardObj()));
        TestMatchup = _testDb.model('TestMatchup', mongoose.Schema(new MatchupObj()));

        _testDb.once('open', function() {
            console.log('Connected to ' + _testDb.name);
            if (_prodDb._hasOpened) {
                promise.fulfill();
            }
        });

        _testDb.on('error', function (err) {
            console.log('Error onnecting to ' + _prodDb.name + ': ' + err);
        });
    }

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
                    matchupTotals: cardData.matchupTotals.slice(),
                    winTotals: cardData.winTotals.slice()
                });
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
    Matchup.count({ }, function(err, c)
    {
        promise.fulfill(c);
    });
    return promise;
};

var shutDown = function() {
    var promise = new mongoose.Promise;
    mongoose.connection.close(function () {
        console.log('Mongoose default connection with DB :' + mongoose.connection.name + ' is disconnected through app termination');
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

var backupProdDb = function() {
    // clear documents from test database collections
//    TestMatchup.remove({}, function(err) {
//        if (err) {
//            console.log('error removing matchup collection:' + err.message);
//        } else {
//            console.log('matchup collection removed');
//        }
//    }).exec();

//    TestCard.remove({}, function(err) {
//        if (err) {
//            console.log('error removing matchup collection:' + err.message);
//        } else {
//            console.log('matchup collection removed');
//        }
//    }).exec();

    // backup cards from production to test
//    Card.find({}, function(err, dbCards) {
//        _.forEach(dbCards, function(dbCard) {
//            var dbTestCard = new TestCard({
//                id: dbCard.id,
//                ranks: dbCard.ranks.slice(),
//                updated: new Date(),
//                matchupTotals: dbCard.matchupTotals.slice(),
//                winTotals: dbCard.winTotals.slice()
//            });
//            dbTestCard.save();
//        });
//    });

    // backup matchups from production to test
//    Matchup.find({}, function(err, dbMatchups) {
//        _.forEach(dbMatchups, function(dbMatchup) {
//            var testDbMatchup = new TestMatchup({
//                cardOneId: dbMatchup.cardOneId,
//                cardTwoId: dbMatchup.cardTwoId,
//                cardOneRank: dbMatchup.cardOneRank,
//                cardTwoRank: dbMatchup.cardTwoRank,
//                winnerId: dbMatchup.winnerId,
//                class: dbMatchup.class,
//                secondsToDecide: dbMatchup.secondsToDecide,
//                created: dbMatchup.created
//            });
//            testDbMatchup.save();
//        });
//    });

    Card.findOne({id: 374}, function(err, dbCard) {
        console.log();
    });

    Matchup.find({}, function(err, dbMatchups) {
        Card.find({}, function(err, dbCards) {
            _.forEach(dbCards, function(dbCard) {
                dbCard.matchupTotals = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
                dbCard.winTotals = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
                var cardMatchups = _.where(dbMatchups, function(dbMatchup) {
                    return dbMatchup.cardOneId === dbCard.id || dbMatchup.cardTwoId === dbCard.id;
                });
                var matchupGroups = _.groupBy(cardMatchups, 'class');
                var keys = Object.keys(matchupGroups);
                _.forEach(keys, function(key) {
                    var group;
                    switch (key) {
                        case 'neutral':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.neutralIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.neutralIdx] = group.length;
                            break;
                        case 'druid':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.druidIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.druidIdx] = group.length;
                            break;
                        case 'hunter':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.hunterIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.hunterIdx] = group.length;
                            break;
                        case 'mage':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.mageIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.mageIdx] = group.length;
                            break;
                        case 'paladin':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.paladinIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.paladinIdx] = group.length;
                            break;
                        case 'priest':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.priestIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.priestIdx] = group.length;
                            break;
                        case 'rogue':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.rogueIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.rogueIdx] = group.length;
                            break;
                        case 'shaman':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.shamanIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.shamanIdx] = group.length;
                            break;
                        case 'warlock':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.warlockIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.warlockIdx] = group.length;
                            break;
                        case 'warrior':
                            group = matchupGroups[key];
                            dbCard.winTotals[cardProvider.warriorIdx] = _.filter(group, function(matchup) {
                                return matchup.winnerId === dbCard.id;
                            }).length;
                            dbCard.matchupTotals[cardProvider.warriorIdx] = group.length;
                            break;
                        default:
                            console.log('Class not found (getRankForClass): ' + key);
                            return null;
                    }
                });
                dbCard.updated = new Date();
                dbCard.save();
                console.log(dbCard.id);
            });
        });
    });
};

exports.initialize = initialize;
exports.backupProdDb = backupProdDb;
exports.deleteCards = deleteCards;
exports.deleteMatchups = deleteMatchups;
exports.getCard = getCard;
exports.getCardsByIds = getCardsByIds;
exports.getTotalMatchups = getTotalMatchups;
exports.saveMatchup = saveMatchup;
exports.saveUpdatedCards = saveUpdatedCards;
exports.shutDown = shutDown;