'use strict';
var _ = require('lodash');
var cardProvider = require('../cardProvider');
var dbProvider = require('../dbProvider');

exports.initialize = function(router) {
    router.post('/newmatchup/', function(req, res) {
        var data = req.body;
        var manaSkip = parseInt(data.manaSkip, 10);
        var cardData = cardProvider.getTwoRandomCards(data.classes, data.rarities, manaSkip);
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

    // cardOne is the one the user picked, cardTwo is the one they didn't
    var saveMatchupParams = '/savematchup/:cardOneId/:cardTwoId/:cardOneRank/:cardTwoRank/:milliseconds/:class';
    router.get(saveMatchupParams, function(req, res) {
        var params = req.params;

        if (params.cardOneId && params.cardTwoId && params.cardOneRank &&
            params.cardTwoRank && params.milliseconds && params.class) {
            var idOne = parseInt(params.cardOneId);
            var idTwo = parseInt(params.cardTwoId);
            var cardClass = params.class;

            if (intCheck(idOne) && intCheck(idTwo)) {
                var rankOne = parseFloat(params.cardOneRank);
                var rankTwo = parseFloat(params.cardTwoRank);
                var milliseconds = parseInt(params.milliseconds);

                if (isNaN(rankOne) || rankOne < 0 || rankOne > 100) {
                    rankOne = 50;
                }
                if (isNaN(rankTwo) || rankTwo < 0 || rankTwo > 100) {
                    rankTwo = 50;
                }
                if (!intCheck(milliseconds)) {
                    milliseconds = 0;
                }

                // calculate new rank
                rankOne = ((100 - rankOne) / 2) + rankOne;
                rankTwo = rankTwo - (rankTwo / 2);

                rankOne = +rankOne.toFixed(2);
                rankTwo = +rankTwo.toFixed(2);

                cardProvider.setCardRank(idOne, rankOne, cardClass);
                cardProvider.setCardRank(idTwo, rankTwo, cardClass);
                cardProvider.saveAllCards();
                dbProvider.saveMatchup(idOne, idTwo, rankOne, rankTwo, idOne, cardClass, milliseconds);
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