'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

var _productionMode = process.env.NODE_ENV === 'production';
var _prodDb;
var _testDb;

var Card;
var Matchup;
var Snapshot;
var App;
var User;
var TestCard = null;
var TestMatchup = null;
var TestSnapshot = null;
var TestApp = null;
var TestUser = null;

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

var SnapshotObj = function() {
    return {
        id: Number,
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
        lastUpdated: Date
    };
};

var Options = function() {
    return { server: { socketOptions: { keepAlive: 1 } } };
};

var getConnectionString = function(useProductionDb) {
    var connectString;

    if (_productionMode) {
        connectString = process.env.DB_CONNECT_URI;
    } else {
        var config = require('./config');
        connectString = useProductionDb ? config.productionDbUri : config.testDbUri;
    }
    return connectString;
};

var getCard = function(cardId) {
    var card = _productionMode ? Card : TestCard;
    return card.findOne({ id: cardId }).exec();
};

// PUBLIC
var initialize = function() {
    var promise = new mongoose.Promise;

    var prodCon = getConnectionString(true);
    _prodDb = mongoose.createConnection(prodCon, new Options());

    _prodDb.once('open', function() {
        Card = _prodDb.model('Card', mongoose.Schema(new CardObj()));
        Matchup = _prodDb.model('Matchup', mongoose.Schema(new MatchupObj()));
        Snapshot = _prodDb.model('Snapshot', mongoose.Schema(new SnapshotObj()));
        App = _prodDb.model('App', mongoose.Schema(new AppObj()));
        User = _prodDb.model('User', mongoose.Schema(new UserObj()));

        console.log('Connected to ' + _prodDb.name);
        if (_productionMode) {
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

    if (!_productionMode) {
        var testCon = getConnectionString(false);
        _testDb = mongoose.createConnection(testCon, new Options());

        _testDb.once('open', function() {
            TestCard = _testDb.model('TestCard', mongoose.Schema(new CardObj()));
            TestMatchup = _testDb.model('TestMatchup', mongoose.Schema(new MatchupObj()));
            TestSnapshot = _testDb.model('TestSnapshot', mongoose.Schema(new SnapshotObj()));
            TestApp = _testDb.model('TestApp', mongoose.Schema(new AppObj()));
            TestUser = _testDb.model('TestUser', mongoose.Schema(new UserObj()));

            console.log('Connected to ' + _testDb.name);
            if (_prodDb/* && _prodDb._hasOpened*/) {
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
    return _productionMode ?
        Card.where('id').in(cardIds).exec() :
        TestCard.where('id').in(cardIds).exec();
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

    var matchup = _productionMode ? new Matchup(matchupObj) : new TestMatchup(matchupObj);
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
                dbCard = _productionMode ? new Card(cardObj) : new TestCard(cardObj);
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
    var matchup = _productionMode ? Matchup : TestMatchup;
    matchup.count({ }, function(err, c)
    {
        promise.fulfill(c);
    });
    return promise;
};

var shutDown = function() {
    var promise = new mongoose.Promise;
    _prodDb.close(function () {
        console.log('Mongoose default connection with DB :' + _prodDb.name + ' is disconnected through app termination');
        promise.fulfill();
    });
    if (!_productionMode) {
        _testDb.close(function () {
            console.log('Mongoose default connection with DB :' + _testDb.name + ' is disconnected through app termination');
            promise.fulfill();
        });
    }
    return promise;
};

var deleteCards = function() {
    var card = _productionMode ? Card : TestCard;
    card.remove({}, function(err) {
        if (err) {
            console.log('error removing card collection:' + err.message);
        } else {
            console.log('card collection removed');
        }
    }).exec();
};

var deleteMatchups = function() {
    var matchup = _productionMode ? Matchup : TestMatchup;
    matchup.remove({}, function(err) {
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
    var promise = new mongoose.Promise;
    var app = _productionMode ? App : TestApp;
    var snapshot = _productionMode ? Snapshot : TestSnapshot;
    app.findOne({}, function(err, appObj) {
        var dateStr = getSnapshotDateString(appObj.lastSnapshot);
        snapshot.where('date').equals(dateStr).exec(function(err, snapshots) {
            promise.fulfill(snapshots);
        });
    });
    return promise;
};

var getSnapshotsByIds = function(cardIds) {
    var snapshot = _productionMode ? Snapshot : TestSnapshot;
    return snapshot.where('id').in(cardIds).exec();
};

var saveAllSnapshots = function(cardDatas) {
    var app = _productionMode ? App : TestApp;

    app.findOne({}, function(err, data) {
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
                data = _productionMode ? new App(newDataObj) : new TestApp(newDataObj);
                doSave = true;
            }

            if (doSave) {
                var curDateStr = getSnapshotDateString(curDate);
                _.forEach(cardDatas, function(cardData) {
                    var snapshotObj = {
                        id: cardData.id,
                        date: curDateStr,
                        ranks: cardData.ranks.slice(),
                        matchupTotals: cardData.matchupTotals.slice(),
                        winTotals: cardData.winTotals.slice()
                    };
                    var snapshot = _productionMode ? new Snapshot(snapshotObj) : new TestSnapshot(snapshotObj);
                    snapshot.save();
                });

                data.lastSnapshot = curDate;
                data.save();
            }
        }
    });
};

var saveUser = function(userData) {
    var user = _productionMode ? User : TestUser;

    user.findOne({ id: userData.userId }, function(err, data) {
        if (err) {
            console.log('error saving user:' + err.message);
        } else {
            var tPicks = parseInt(userData.totalPicks, 10);
            var tWins = parseInt(userData.totalWins, 10);
            var avgTime = parseInt(userData.averagePickTime, 10);
            var uLevel = parseInt(userData.unlockLevel, 10);

            if (data) {
                data.totalPicks = tPicks;
                data.totalWins = tWins;
                data.averagePickTime = avgTime;
                data.unlockLevel = uLevel;
            } else {
                var dataObj = {
                    id: userData.userId,
                    totalPicks: tPicks,
                    totalWins: tWins,
                    averagePickTime: avgTime,
                    unlockLevel: uLevel
                };
                data = _productionMode ? new User(dataObj) : new TestUser(dataObj);
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
        TestCard: TestCard,
        TestMatchup: TestMatchup
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
