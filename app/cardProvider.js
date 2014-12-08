'use strict';
var _ = require('lodash');
var Q = require('q');
var cardsData = require('./cardsData');
var dbProvider = require('./dbProvider');
var allCardsRawData = require('./../data/sourceCardData').cardList;

var CardData = cardsData.CardData;
var _defaultTotals = cardsData.defaultTotals;
var _cardDatas = [];
var _cardDatasHash = {};
var _saveCounter = 0;
var _productionMode = process.env.NODE_ENV === 'production';
var _baseUrl = 'http:\/\/wow.zamimg.com\/images\/hearthstone\/cards\/enus\/original\/';

var storeCardDatas = function() {
    _cardDatas = _.map(allCardsRawData, function(rawData) {
        var prodUrl = _baseUrl + rawData.gameId + '.png';
        var imageUrl = _productionMode ? prodUrl : '../lib/images/hs-images/' + rawData.gameId + '.png';
        return new CardData(
            rawData.name,
            rawData.gameId,
            rawData.hero,
            rawData.mana,
            imageUrl,
            rawData.quality,
            rawData.set,
            rawData.category);
    });
};

var initialize = function() {
    var deferred = Q.defer();
    storeCardDatas();

    _.forEach(_cardDatas, function(cardData) {
        _cardDatasHash[cardData.id] = cardData;
    });

    var ids = _.pluck(_cardDatas, 'id');
    dbProvider.getCardsByIds(ids)
        .then(function(dbCards) {
            _.forEach(dbCards, function(dbCard) {
                var cardData = _.find(_cardDatas, { id: dbCard.id });
                if (cardData) {
                    cardData.ranks = dbCard.ranks.slice();
                    cardData.updated = dbCard.updated;
                    cardData.matchupTotals = dbCard.matchupTotals && dbCard.matchupTotals.length > 0 ?
                        dbCard.matchupTotals.slice() : _defaultTotals.slice();
                    cardData.winTotals = dbCard.winTotals && dbCard.winTotals.length > 0 ?
                        dbCard.winTotals.slice() : _defaultTotals.slice();
                }
            });

            deferred.resolve();
        });

    return deferred.promise;
};

var getCardDatasByClass = function(className) {
    return _.where(_cardDatas, { class: className });
};

var getTwoRandomCardsInternal = function(cardDatas, className) {
    // if there are enough cards, make sure all them get matched up more or less evenly
    // by sorting the cards so that the ones with the fewest matchups are first
    // and then only choosing from the first quarter of the list if it makes sense to do so
    // also make sure that hero cards are better represented than neutral cards, if there are any

    var sorted = _.sortBy(cardDatas, function(cardData) {
        return cardData.getMatchupTotalForClass(className);
    });

    var neutralCards = _.filter(sorted, { 'class': 'neutral' });
    var heroCards = _.reject(sorted, { 'class': 'neutral' });

    neutralCards.length = neutralCards.length > 4 ? Math.ceil(neutralCards.length / 4) : neutralCards.length;
    sorted = _.union(neutralCards, heroCards);

    var indOne = _.random(sorted.length - 1);
    var indTwo = indOne;

    while ( indOne === indTwo ) {
         indTwo = _.random(sorted.length - 1);
    }

    var cardOne = sorted[indOne];
    var cardTwo = sorted[indTwo];
    
    return {
        cardOne: cardOne,
        cardTwo: cardTwo
    };
};

var getFilteredCards = function(includeClasses) {
    var classCards = _.filter(_cardDatas, function(card) {
        return (_.contains(includeClasses, card.class));
    });
    var cards = [];
    var rarity;
    var randomRarity;
    var rarities = [ 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4 ];

    while (cards.length < 2) {
        randomRarity = Math.floor(Math.random() * rarities.length);
        switch (rarities[randomRarity]) {
            case 1:
                rarity = 'common';
                break;
            case 2:
                rarity = 'rare';
                break;
            case 3:
                rarity = 'epic';
                break;
            case 4:
                rarity = 'legendary';
                break;
        }
        cards = _.filter(classCards, { 'rarity': rarity });
    }

    return cards;
};

var getTwoRandomCards = function(includeClasses, cardHistory) {
    var className = includeClasses.length === 1 ? includeClasses[0] : _.find(includeClasses, function(className) {
        return className !== 'neutral';
    });

    var twoCards;
    var numLoops = 0;
    var hasId = true;

    while (numLoops < 20 && hasId) {
        var cards = getFilteredCards(includeClasses, cardHistory);
        twoCards = getTwoRandomCardsInternal(cards, className);
        hasId = _.contains(cardHistory, twoCards.cardOne.id) || _.contains(cardHistory, twoCards.cardTwo.id);
        numLoops = numLoops + 1;
    }

    return {
        cardOne: twoCards.cardOne,
        cardTwo: twoCards.cardTwo
    };
};

var saveAllCards = function() {
    _saveCounter = _saveCounter + 1;

    var saveCount =  _productionMode ? 5 : 1;
    if (_saveCounter > saveCount) {
        dbProvider.saveUpdatedCards(_cardDatas);
        dbProvider.saveAllSnapshots(_cardDatas);
        _saveCounter = 0;
    }
};

var setCardRank = function(cardId, rank, className, didWin) {
    var cardData = _cardDatasHash[cardId];
    if (cardData) {
        cardData.setRankForClass(className, rank);
        cardData.setMatchupTotalForClass(className);
        cardData.updated = new Date();

        if (didWin) {
            cardData.setWinTotalForClass(className);
        }
    }
};

var getCardDatas = function() {
    return _cardDatas;
};

exports.initialize = initialize;
exports.getCardDatas = getCardDatas;
exports.getCardDatasByClass = getCardDatasByClass;
exports.getTwoRandomCards = getTwoRandomCards;
exports.saveAllCards = saveAllCards;
exports.setCardRank = setCardRank;
