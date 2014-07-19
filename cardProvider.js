'use strict';
var _ = require('lodash');
var dbProvider = require('./dbProvider');
var allCardsData = require('./data/all-cards.json');

var _allCards =  allCardsData.cards;
var _manaVals = [];
var _cardHeroes = [];
var _playableCards = [];
var _playableCardsHash = {};

var getPlayableCardsByHero = function(heroName) {
    return _.where(_playableCards, { hero: heroName });
};

var getTwoRandomCards = function(cards) {
    var indOne = Math.floor(Math.random() * cards.length);
    var indTwo = indOne;
    
    do {
         indTwo = Math.floor(Math.random() * cards.length);
    } while ( indOne === indTwo );

    var cardOne = cards[indOne];
    var cardTwo = cards[indTwo];
    
    return {
        cardOne: cardOne,
        cardTwo: cardTwo
    };
};

// PUBLIC 

var initialize = function() {
    // get the possible heroes
    _cardHeroes = _.chain(_allCards).pluck('hero').unique().value();

    _playableCards = _.filter(_allCards, function(card) {
        return card.collectible && card.type !== 'ability' && card.type !== 'hero';
    });

    // get all the mana values for the purpose of getting
    // a random one weighted by the number of cards per mana cost
    _manaVals = _.pluck(_playableCards, 'mana');

    // add rankings to cards
    var ids = _.pluck(_playableCards, 'id');
    dbProvider.getCardsByIds(ids).then(function(dbCards) {
        _.forEach(dbCards, function(dbCard) {
            var card = _.where(_playableCards, { 'id': dbCard.id })[0];
            if (card) {
                card.neutralRank = dbCard.neutralRank;
            }
        });
    }, function(err) {
        console.log(err);
    });

    _.forEach(_playableCards, function(card) {
       _playableCardsHash[card.id] = card;
    });
};

var getTwoRandomNeutralCards = function(manaSkip) {
    var randomInd;
    var randomMana;
    manaSkip = parseInt(manaSkip, 10);

    do {
        randomInd = Math.floor(Math.random() * _manaVals.length);
        randomMana = _manaVals[randomInd];
    } while ( randomMana === manaSkip );

    // group all mana cost cards greater than 10 with the 10 cards
    // and any zero cost cards with the one mana cards
    if (randomMana > 10) {
        randomMana = 10;
    } else if (randomMana < 1) {
        randomMana = 1;
    }

    var cards = _.filter(getPlayableCardsByHero('neutral'), function(card) {
        return (randomMana > 1 && randomMana < 10 && card.mana === randomMana) ||
            (randomMana >= 10 && card.mana >= 10) ||
            (randomMana <= 1 && card.mana <= 1);
    });

    var twoCards = getTwoRandomCards(cards);

    return {
        cardOne: twoCards.cardOne,
        cardTwo: twoCards.cardTwo,
        mana: randomMana
    };
};

var setNeutralRank = function(cardId, rank) {
    var card = _playableCardsHash[cardId];
    if (card) {
        card.neutralRank = rank;
        card.updated = new Date();
    }
};

exports.initialize = initialize;
exports.getTwoRandomNeutralCards = getTwoRandomNeutralCards;
exports.setNeutralRank = setNeutralRank;
