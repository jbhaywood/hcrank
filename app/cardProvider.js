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
var _productionMode = process.env.NODE_ENV === 'production';
var _baseUrl = 'http:\/\/wow.zamimg.com\/images\/hearthstone\/cards\/enus\/original\/';

var initialize = function() {
    var deferred = Q.defer();

    _cardDatas = _.map(allCardsRawData, function(rawData) {
        var prodUrl = _baseUrl + rawData.gameId + '.png';
        var imageUrl = _productionMode ? prodUrl : '../lib/images/hs-images/original/' + rawData.gameId + '.png';
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

    _.forEach(_cardDatas, function(cardData) {
        _cardDatasHash[cardData.id] = cardData;
    });

    var ids = _.pluck(_cardDatas, 'id');
    dbProvider.getCardsByIds(ids)
        .then(function(dbCards) {
            _.forEach(dbCards, function(dbCard) {
                var cardData = _.find(_cardDatas, { id: dbCard.id });
                if (cardData) {
                    cardData.ranks = dbCard.ranks.slice(0);
                    cardData.updated = dbCard.updated;
                    cardData.matchupTotals = dbCard.matchupTotals && dbCard.matchupTotals.length > 0 ?
                        dbCard.matchupTotals.slice(0) : _defaultTotals.slice(0);
                    cardData.winTotals = dbCard.winTotals && dbCard.winTotals.length > 0 ?
                        dbCard.winTotals.slice(0) : _defaultTotals.slice(0);
                }
            });

            deferred.resolve();
        });

    return deferred.promise;
};

var getCardDatasByClass = function(hero) {
    return _.where(_cardDatas, function(cardData) {
        return cardData.class === hero || cardData.set === hero;
    });
};

var getRandomCardsInternal = function(cards, hero, numCards, excludedIds) {
    // filter out the cards to exclude, unless it would result in fewer than the required number of cards
    while (excludedIds.length > cards.length + numCards) {
        excludedIds = _.sample(excludedIds, Math.ceil(excludedIds.length / 1.25));
    }

    var filteredCards = _.filter(cards, function(card) {
        return !_.contains(excludedIds, card.id);
    });

    // if there are enough cards, make sure all them get matched up more or less evenly
    // by sorting the cards so that the ones with the fewest matchups are first
    // and then only choosing from the first quarter of the list if it makes sense to do so
    // also make sure that hero cards are better represented than neutral cards
    var sortedCards = _.sortBy(filteredCards, function(cardData) {
        // make sure some of the older cards get sprinkled in the mix too
        return Math.random() > 0.75 ? 1 : cardData.getMatchupTotalForClass(hero);
    });

    var neutralCards = _.filter(sortedCards, { 'class': 'neutral' });
    var heroCards = _.difference(sortedCards, neutralCards);

    neutralCards.length = neutralCards.length > 4 ? Math.ceil(neutralCards.length / 4) : neutralCards.length;
    sortedCards = _.union(neutralCards, heroCards);

    return _.sample(sortedCards, numCards);
};

var getFilteredCards = function(hero) {
    var rarity;
    var randomRarity;
    var rarities = [ 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4 ];
    var combinedCards = _.filter(_cardDatas, function(card) {
        return card.class === hero || card.class === 'neutral';
    });

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

    return _.filter(combinedCards, function(card) {
        return card.rarity === rarity;
    });
};

var getRandomCards = function(hero, numCards, excludedIds) {
    var result;

    var filteredCards = getFilteredCards(hero);
    result = getRandomCardsInternal(filteredCards, hero, numCards, excludedIds);

    while (result.length !== numCards) {
        result = getRandomCards(hero, numCards, excludedIds);
    }

    return result;
};

var saveAllCards = function() {
    dbProvider.saveUpdatedCards(_cardDatas);
    dbProvider.saveAllSnapshots(_cardDatas);
};

var getCardData = function(id) {
    return _cardDatasHash[id];
};

var getCardDatas = function(ids) {
    return _.map(ids, function(id) { return _cardDatasHash[id]; });
};

exports.initialize = initialize;
exports.getCardData = getCardData;
exports.getCardDatas = getCardDatas;
exports.getCardDatasByClass = getCardDatasByClass;
exports.getRandomCards = getRandomCards;
exports.saveAllCards = saveAllCards;