'use strict';
var _ = require('lodash');
var cardProvider = require('../cardProvider');
var dbProvider = require('../dbProvider');

exports.initialize = function(router) {
    router.post('/newmatchup/', function(req, res) {
        var data = req.body;
        var cardData = cardProvider.getTwoRandomNeutralCards(data.manaSkip);
        var sendData = {
            cardOne: {
                id: cardData.cardOne.id,
                url: cardData.cardOne.image_url,
                neutralRank: cardData.cardOne.neutralRank
            },
            cardTwo: {
                id: cardData.cardTwo.id,
                url: cardData.cardTwo.image_url,
                neutralRank: cardData.cardTwo.neutralRank
            },
            mana:cardData.mana
        };
        res.send(sendData);
    });

    var intCheck = function(int) {
        return typeof int === 'number' && (int % 1) === 0;
    };

    var saveMatchupParams = '/savematchup/:cardOneId/:cardTwoId/:cardOneNeutralRank/:cardTwoNeutralRank/:milliseconds';
    router.get(saveMatchupParams, function(req, res) {
        var params = req.params;

        if (params.cardOneId && params.cardTwoId && params.cardOneNeutralRank &&
            params.cardTwoNeutralRank && params.milliseconds) {
            var idOne = parseInt(params.cardOneId);
            var idTwo = parseInt(params.cardTwoId);

            if (intCheck(idOne) && intCheck(idTwo)) {
                var rankOne = parseFloat(params.cardOneNeutralRank);
                var rankTwo = parseFloat(params.cardTwoNeutralRank);
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

                cardProvider.setNeutralRank(idOne, rankOne);
                cardProvider.setNeutralRank(idTwo, rankTwo);
                cardProvider.saveAllCards();
                dbProvider.saveMatchup(idOne, idTwo, idOne, milliseconds);
            }
        }

        res.end();
    });

    router.post('/getcards/', function(req, res) {
        var data = req.body;
        var theClass = data.class;
        var cardDatas = cardProvider.getPlayableCardsByClass(theClass);
        var sortedDatas = _.chain(cardDatas)
            .sortBy(function(cardData) {
                return cardProvider.getCardRankForClass(cardData, theClass);
            })
            .reverse()
            .map(function(cardData) {
                return {
                    name: cardData.name,
                    url: cardData.image_url
                };
            })
            .value();
        var sendData = {
            cards: sortedDatas
        };
        res.send(sendData);
    });
};