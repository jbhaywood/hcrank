'use strict';
var cardProvider = require('../cardProvider');
var dbProvider = require('../dbProvider');

exports.initialize = function(router) {
    router.post('/newmatchup/', function(req, res) {
        var data = req.body;
        cardProvider.getTwoRandomNeutralCards(data.manaSkip)
            .then(function(cardData) {
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
            }, function(err) {
                console.log('Error: api-newMatchup: ' + err);
            });
    });

    router.post('/savematchup/', function(req, res) {
        var data = req.body;
        var idOne = parseInt(data.cardOne.id);
        var idTwo = parseInt(data.cardTwo.id);
        var rankOne = parseFloat(data.cardOne.neutralRank);
        var rankTwo = parseFloat(data.cardTwo.neutralRank);
        var milliseconds = parseInt(data.milliseconds);
        cardProvider.setNeutralRank(idOne, rankOne);
        cardProvider.setNeutralRank(idTwo, rankTwo);
        dbProvider.saveMatchup(idOne, idTwo, idOne, milliseconds);
        res.send(null);
    });
};