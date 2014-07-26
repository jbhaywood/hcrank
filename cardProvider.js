'use strict';
var _ = require('lodash');
var Q = require('q');
var dbProvider = require('./dbProvider');
var allCardsData = require('./data/all-cards.json');

var _allCards =  allCardsData.cards;
var _manaVals = [];
var _cardHeroes = [];
var _playableCards = [];
var _playableCardsHash = {};
var _playableNeutralCards = [];
var _saveCounter = 0;

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
    var deffered = Q.defer();

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
            var card = _.find(_playableCards, { id: dbCard.id });
            if (card) {
                card.neutralRank = dbCard.neutralRank;
                card.classRanks = dbCard.classRanks.slice();
            }
        });

        _.forEach(_playableCards, function(card) {
            _playableCardsHash[card.id] = card;
        });

        _playableNeutralCards = getPlayableCardsByHero('neutral');

        deffered.resolve();
    }, function(err) {
        console.log(err);
    });

    return deffered.promise;
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

    var cards = _.filter(_playableNeutralCards, function(card) {
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

var saveAllCards = function() {
    _saveCounter = _saveCounter + 1;

    if (_saveCounter === 100) {
        dbProvider.saveCards(_playableNeutralCards);
        _saveCounter = 0;
    }
};

var setNeutralRank = function(cardId, rank) {
    var card = _playableCardsHash[cardId];
    if (card) {
        card.neutralRank = rank;
        card.updated = new Date();
    }
};

var resetCardRanks = function (){
    var rankedNeutralCards = require('./data/rankedNeutralCards.js');
    var datas = rankedNeutralCards.cardList;
    _.chain(datas)
        .map(function(data) {
            var avgRank = 	_.reduce(data.ranks, function(sum, num)
            {
                return sum + num;
            }, 0) / data.ranks.length;

            return {
                id: data.id,
                rank: avgRank
            };
        })
        .forEach(function(data) {
            var found = _.find(_playableNeutralCards, { id: data.id });
            if (found) {
                found.neutralRank = data.rank;
                found.updated = new Date();
            }
        });
};

exports.initialize = initialize;
exports.getTwoRandomNeutralCards = getTwoRandomNeutralCards;
exports.resetCardRanks = resetCardRanks;
exports.saveAllCards = saveAllCards;
exports.setNeutralRank = setNeutralRank;
