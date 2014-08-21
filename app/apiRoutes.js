'use strict';
var _ = require('lodash');
var elo = require('elo-rank')();
var cardProvider = require('../cardProvider');
var dbProvider = require('../dbProvider');
var sprintf = require('sprintf-js').sprintf;

exports.initialize = function(router) {
    router.post('/newmatchup/', function(req, res) {
        var data = req.body;
        var manasSkip = _.map(data.manasSkip, function(str) {
            return parseInt(str, 10);
        });
        var cardData = cardProvider.getTwoRandomCards(data.classes, data.rarities, manasSkip);
        var cardClass = data.classes.length === 1 ? data.classes[0] : _.find(data.classes, function(cardClass) {
            return cardClass !== 'neutral';
        });
        var sendData = {
            cardOne: {
                id: cardData.cardOne.id,
                url: cardData.cardOne.url,
                currentRank: cardData.cardOne.getRankForClass(cardClass)
            },
            cardTwo: {
                id: cardData.cardTwo.id,
                url: cardData.cardTwo.url,
                currentRank: cardData.cardTwo.getRankForClass(cardClass)
            },
            mana: cardData.mana,
            class: cardClass
        };
        res.send(sendData);
    });

    var intCheck = function(int) {
        return typeof int === 'number' && (int % 1) === 0;
    };

    router.post('/savematchup/', function(req, res) {
        var data = req.body;

        if (data.cardWinnerId && data.cardLoserId && data.cardWinnerRank &&
            data.cardLoserRank && data.milliseconds && data.class) {
            var idWinner = parseInt(data.cardWinnerId);
            var idLoser = parseInt(data.cardLoserId);
            var cardClass = data.class;

            if (intCheck(idWinner) && intCheck(idLoser)) {
                var oldWinnerRank = parseFloat(data.cardWinnerRank);
                var oldLoserRank = parseFloat(data.cardLoserRank);
                var milliseconds = parseInt(data.milliseconds);

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

                var rankWinner = elo.updateRating(winnerExpected, 1, oldWinnerRank);
                var rankLoser = elo.updateRating(loserExpected, 0, oldLoserRank);

                console.log(sprintf('winner rank %s, new rank: %s', oldWinnerRank, rankWinner));
                console.log(sprintf('loser rank %s, new rank: %s', oldLoserRank, rankLoser));

                cardProvider.setCardRank(idWinner, rankWinner, cardClass, true);
                cardProvider.setCardRank(idLoser, rankLoser, cardClass, false);
                cardProvider.saveAllCards();
                dbProvider.saveMatchup(idWinner, idLoser, rankWinner, rankLoser, idWinner, cardClass, milliseconds);
            }
        }

        res.end();
    });

    router.post('/getcards/', function(req, res) {
        var data = req.body;
        var cardClass = data.class;
        var cardDatas = cardProvider.getCardDatasByClass(cardClass);
        var sortedDatas = _.chain(cardDatas)
            .sortBy(function(cardData) {
                return cardData.getRankForClass(cardClass);
            })
            .reverse()
            .map(function(cardData) {
                return {
                    name: cardData.name,
                    url: cardData.url
                };
            })
            .value();
        var sendData = {
            cards: sortedDatas
        };
        res.send(sendData);
    });
};