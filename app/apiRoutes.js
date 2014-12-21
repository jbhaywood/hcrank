'use strict';
var _ = require('lodash');
var elo = require('elo-rank')();
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');

var test = false;
var _minPickCount = 10;

exports.initialize = function(router) {
    router.post('/newmatchup/', function(req, res) {
        var data = req.body;
        var excludedIds = data.excludedIds || [];
        var numCards = parseInt(data.numCards, 10);
        var cards = cardProvider.getRandomCards(data.hero, numCards, excludedIds);
        var sendData = _.map(cards, function(card) {
            return {
                id: card.id,
                name: card.name,
                url: card.url,
                rank: card.getRankForClass(data.hero),
                winRatio: card.getWinRatioForClass(data.hero),
                unranked: card.getMatchupTotalForClass(data.hero) < _minPickCount
            };
        });
        res.send(sendData);
    });

    var intCheck = function(int) {
        return typeof int === 'number' && (int % 1) === 0;
    };

    router.post('/savematchup/', function(req, res) {
        var data = req.body;

        if (data.cardWinnerId && data.cardLoserId && data.cardWinnerRank &&
            data.cardLoserRank && data.milliseconds && data.class) {
            var idWinner = data.cardWinnerId;
            var idLoser = data.cardLoserId;
            var className = data.class;
            var oldWinnerRank = parseFloat(data.cardWinnerRank);
            var oldLoserRank = parseFloat(data.cardLoserRank);
            var milliseconds = parseInt(data.milliseconds, 10);

            if (isNaN(oldWinnerRank)) {
                oldWinnerRank = 1300;
            }
            if (isNaN(oldLoserRank)) {
                oldLoserRank = 1300;
            }
            if (!intCheck(milliseconds)) {
                milliseconds = 0;
            }

            elo.setKFactor(128);

            var winnerExpected = elo.getExpected(oldWinnerRank, oldLoserRank);
            var loserExpected = elo.getExpected(oldLoserRank, oldWinnerRank);

            var rankWinner = Math.floor(elo.updateRating(winnerExpected, 1, oldWinnerRank));
            var rankLoser = Math.floor(elo.updateRating(loserExpected, 0, oldLoserRank));

            cardProvider.setCardRank(idWinner, rankWinner, className, true);
            cardProvider.setCardRank(idLoser, rankLoser, className, false);
            cardProvider.saveAllCards();
            dbProvider.saveMatchup(idWinner, idLoser, rankWinner, rankLoser, idWinner, className, milliseconds);
        }

        res.end();
    });

    router.post('/getcards/', function(req, res) {
        var data = req.body;
        var className = (data.class || 'neutral').toLowerCase();
        var numCards = parseInt(data.numCards, 10);
        var cardDatas = cardProvider.getCardDatasByClass(className);

        var sortedDatas = _.chain(cardDatas)
            .sortBy(function(cardData) {
                return cardData.getRankForClass(className);
            })
            .reverse()
            .map(function(cardData) {
                return {
                    name: cardData.name,
                    class: cardData.class,
                    mana: cardData.mana,
                    totalMatchups: cardData.getMatchupTotalForClass(className),
                    totalWins: cardData.getWinTotalForClass(className),
                    rank: cardData.getRankForClass(className),
                    url: cardData.url,
                    rarity: cardData.rarity,
                    set: cardData.set,
                    category: cardData.category
                };
            })
            .value();

        if (numCards) {
            sortedDatas.length = numCards;
        }

        var sendData = {
            data: sortedDatas
        };

        res.send(sendData);
    });

    router.post('/saveuserdata/', function(req, res) {
        dbProvider.saveUser(req.body);
        res.end();
    });
};