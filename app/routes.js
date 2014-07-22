'use strict';
var cardProvider = require('../cardProvider');
var dbProvider = require('../dbProvider');

exports.initialize = function(app) {
    app.post('/api/newmatchup/', function(req, res) {
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

    app.post('/api/savematchup/', function(req) {
        var data = req.body;
        var idOne = parseInt(data.cardOne.id);
        var idTwo = parseInt(data.cardTwo.id);
        var rankOne = parseFloat(data.cardOne.neutralRank);
        var rankTwo = parseFloat(data.cardTwo.neutralRank);
        var milliseconds = parseInt(data.milliseconds);
        cardProvider.setNeutralRank(idOne, rankOne);
        cardProvider.setNeutralRank(idTwo, rankTwo);
        dbProvider.saveMatchup(idOne, idTwo, idOne, milliseconds);
    });
};