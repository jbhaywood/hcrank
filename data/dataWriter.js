'use strict';
var _ = require('lodash');
var stringifyObject = require('stringify-object');
var fs = require('fs');

exports.writeData = function() {
    var allCardsData = require('./all-cards.json');
    var _allCards =  allCardsData.cards;
    var _playableCards = _.filter(_allCards, function(card) {
        return card.collectible && card.type !== 'ability' && card.type !== 'hero';
    });
    var rankDatas = _.map(_playableCards, function(card) {
        var obj = {
            id: card.id,
            name: card.name,
            ranks: []
        };
        return stringifyObject(obj, {
            indent: '    '
        });
    });
    fs.writeFileSync('./rankedCards.js', rankDatas);
};

exports.transferData = function() {
    var rankedNeutralCards = require('./rankedNeutralCards.js');
    var rankedAllCards = require('./rankedCards.js');
    var neutralDatas = rankedNeutralCards.cardList;
    var allDatas = rankedAllCards.cardList;

    var writeableDatas = _.map(allDatas, function(card) {
        var found = _.find(neutralDatas, { id: card.id });
        if (found) {
            card.ranks = found.ranks.slice();
        }
        return stringifyObject(card, {
            indent: '    '
        });
    });

    fs.writeFileSync('./rankedCards.js', writeableDatas);
};