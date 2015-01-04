'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

var _productionMode = process.env.NODE_ENV === 'production';
var _db;

var Card;
var Matchup;
var Snapshot;
var App;
var User;

var CardObj = function() {
    return {
        id: String,
        ranks: [Number],
        updated: Date,
        matchupTotals: [Number],
        winTotals: [Number]
    };
};

var MatchupObj = function() {
    return {
        cardOneId: String,
        cardTwoId: String,
        cardOneRank: Number,
        cardTwoRank: Number,
        winnerId: String,
        class: String,
        secondsToDecide: Number,
        created: Date
    };
};

var SnapshotObj = function() {
    return {
        id: String,
        date: String,
        ranks: [Number],
        matchupTotals: [Number],
        winTotals: [Number]
    };
};

var AppObj = function() {
    return {
        lastSnapshot: Date
    };
};

var UserObj = function() {
    return {
        id: String,
        totalPicks: Number,
        totalWins: Number,
        averagePickTime: Number,
        unlockLevel: Number,
        arenaRankRuns: Number,
        lastUpdated: Date,
        created: Date
    };
};

var Options = function() {
    return { server: { socketOptions: { keepAlive: 1 } } };
};

var getConnectionString = function() {
    var result;
    if (_productionMode && process.env.DB_CONNECT_URI) {
        result = process.env.DB_CONNECT_URI;
    } else {
        var config = require('./config');
        result = _productionMode ? config.productionDbUri : config.testDbUri;
    }
    return result;
};

var getCard = function(cardId) {
    return Card.findOne({ id: cardId }).exec();
};

// PUBLIC
var initialize = function() {
    var promise = new mongoose.Promise();

    var conStr = getConnectionString(true);
    _db = mongoose.createConnection(conStr, new Options());

    _db.once('open', function() {
        Card = _db.model('Card', mongoose.Schema(new CardObj()));
        Matchup = _db.model('Matchup', mongoose.Schema(new MatchupObj()));
        Snapshot = _db.model('Snapshot', mongoose.Schema(new SnapshotObj()));
        App = _db.model('App', mongoose.Schema(new AppObj()));
        User = _db.model('User', mongoose.Schema(new UserObj()));

        console.log('Connected to ' + _db.name);
        promise.fulfill();
    });

    _db.on('error', function (err) {
        console.log('Error with ' + _db.name + ': ' + err);
    });

    _db.on('disconnected', function () {
        console.log('Mongoose connection to ' + _db.name + ' disconnected');
    });

    return promise;
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

    var matchup = new Matchup(matchupObj);
    matchup.save();
};

var saveUpdatedCards = function(cardDatas) {
    _.forEach(cardDatas, function(cardData) {
        getCard(cardData.id).then(function(dbCard) {
            var doSave = !dbCard || cardData.updated > dbCard.updated;

            if (!dbCard) {
                var cardObj = {
                    id: cardData.id,
                    ranks: cardData.ranks.slice(0),
                    updated: new Date(),
                    matchupTotals: cardData.matchupTotals.slice(0),
                    winTotals: cardData.winTotals.slice(0)
                };
                dbCard = new Card(cardObj);
            } else if (cardData.updated > dbCard.updated) {
                dbCard.ranks = cardData.ranks.slice(0);
                dbCard.updated = cardData.updated;
                dbCard.matchupTotals = cardData.matchupTotals.slice(0);
                dbCard.winTotals = cardData.winTotals.slice(0);
            }

            if (doSave) {
                dbCard.save();
            }
        }, function(err) {
            console.log(err);
        });
    });
};

var getTotalMatchups = function() {
    var promise = new mongoose.Promise();
    Matchup.count({ }, function(err, c)
    {
        promise.fulfill(c);
    });
    return promise;
};

var shutDown = function() {
    var promise = new mongoose.Promise();
    _db.close(function () {
        console.log('Mongoose default connection with DB :' + _db.name + ' is disconnected through app termination');
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

var getSnapshotDateString = function(date) {
    var dayNum = date.getDate();
    var monthNum = date.getMonth() + 1;
    var dayStr = dayNum < 10 ? '0' + dayNum.toString() : dayNum.toString();
    var monthStr = monthNum < 10 ? '0' + monthNum.toString() : monthNum.toString();
    return date.getFullYear().toString() + monthStr + dayStr;
};

var getLastSnapshots = function() {
    var promise = new mongoose.Promise();
    App.findOne({}, function(err, appObj) {
        var dateStr = getSnapshotDateString(appObj.lastSnapshot);
        Snapshot.where('date').equals(dateStr).exec(function(err, snapshots) {
            promise.fulfill(snapshots);
        });
    });
    return promise;
};

var getSnapshotsByIds = function(cardIds) {
    Snapshot.where('id').in(cardIds).exec();
};

var saveAllSnapshots = function(cardDatas) {
    App.findOne({}, function(err, data) {
        if (err) {
            console.log('error saving snapshots:' + err.message);
        } else {
            var curDate = new Date();
            var doSave = false;

            if (data) {
                var hourDiff = Math.abs(curDate - data.lastSnapshot) / 3600000;
                doSave = hourDiff >= 24;
            } else {
                var newDataObj = { lastSnapshot: curDate };
                data = new App(newDataObj);
                doSave = true;
            }

            if (doSave) {
                var curDateStr = getSnapshotDateString(curDate);
                _.forEach(cardDatas, function(cardData) {
                    var snapshotObj = {
                        id: cardData.id,
                        date: curDateStr,
                        ranks: cardData.ranks.slice(0),
                        matchupTotals: cardData.matchupTotals.slice(0),
                        winTotals: cardData.winTotals.slice(0)
                    };
                    var snapshot = new Snapshot(snapshotObj);
                    snapshot.save();
                });

                data.lastSnapshot = curDate;
                data.save();
            }
        }
    });
};

var saveUser = function(userData) {
    User.findOne({ id: userData.userId }, function(err, data) {
        if (err) {
            console.log('error saving user:' + err.message);
        } else {
            var tPicks = parseInt(userData.totalPicks, 10);
            var tWins = parseInt(userData.totalWins, 10);
            var avgTime = parseInt(userData.averagePickTime, 10);
            var uLevel = parseInt(userData.unlockLevel, 10);
            var arenaRuns = parseInt(userData.arenaRankRuns, 10);

            if (data) {
                data.totalPicks = tPicks;
                data.totalWins = tWins;
                data.averagePickTime = avgTime;
                data.unlockLevel = uLevel;
                data.arenaRankRuns = arenaRuns;
            } else {
                var dataObj = {
                    id: userData.userId,
                    totalPicks: tPicks,
                    totalWins: tWins,
                    averagePickTime: avgTime,
                    unlockLevel: uLevel,
                    arenaRankRuns: arenaRuns,
                    created: new Date()
                };
                data = new User(dataObj);
            }

            data.lastUpdated = new Date();
            data.save();
        }
    });
};

var getDbModels = function() {
    return {
        Card: Card,
        Matchup: Matchup,
        Snapshot: Snapshot
    };
};

exports.initialize = initialize;
exports.deleteCards = deleteCards;
exports.deleteMatchups = deleteMatchups;
exports.getDbModels = getDbModels;
exports.getCardsByIds = getCardsByIds;
exports.getLastSnapshots = getLastSnapshots;
exports.getSnapshotsByIds = getSnapshotsByIds;
exports.getTotalMatchups = getTotalMatchups;
exports.saveAllSnapshots = saveAllSnapshots;
exports.saveMatchup = saveMatchup;
exports.saveUpdatedCards = saveUpdatedCards;
exports.saveUser = saveUser;
exports.shutDown = shutDown;
