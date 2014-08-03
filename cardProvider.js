'use strict';
var _ = require('lodash');
var Q = require('q');
var dbProvider = require('./dbProvider');
var allCardsData = require('./data/all-cards.json');

var _allCards =  allCardsData.cards;
var _playableCards = [];
var _playableCardsHash = {};
var _playableNeutralCards = [];
var _manaVals = [];
var _saveCounter = 0;

var _neutralIdx = 0;
var _druidIdx = 1;
var _hunterIdx = 2;
var _mageIdx = 3;
var _paladinIdx = 4;
var _priestIdx = 5;
var _rogueIdx = 6;
var _shamanIdx = 7;
var _warlockIdx = 8;
var _warriorIdx = 9;

var getPlayableCards = function() {
    if (_playableCards.length === 0) {
        _playableCards = _.filter(_allCards, function(card) {
            return card.collectible && card.category !== 'ability' && card.category !== 'hero';
        });
    }
    return _playableCards;
};

var getPlayableCardsByClass = function(className) {
    var cards = getPlayableCards();
    return _.where(cards, { hero: className });
};

var getTwoRandomCards = function(cards) {
    var sorted;
    // if there are enough cards, make sure all them get matched up more or less evenly
    if (cards.length > 4) {
        // sort cards so that the most recently updated are last
        sorted = _.sortBy(cards, 'updated');
        // then pick randomly from the first third
        sorted.length = Math.ceil(sorted.length / 3);
    } else {
        sorted = cards.slice();
    }

    var indOne = Math.floor(Math.random() * sorted.length);
    var indTwo = indOne;
    
    do {
         indTwo = Math.floor(Math.random() * sorted.length);
    } while ( indOne === indTwo );

    var cardOne = sorted[indOne];
    var cardTwo = sorted[indTwo];
    
    return {
        cardOne: cardOne,
        cardTwo: cardTwo
    };
};

// PUBLIC 

var initialize = function() {
    var deferred = Q.defer();
    var cards = getPlayableCards();

    // get all the mana values for the purpose of getting
    // a random one weighted by the number of cards per mana cost
    _manaVals = _.pluck(cards, 'mana');

    // add rankings to cards
    var ids = _.pluck(cards, 'id');
    dbProvider.getCardsByIds(ids).then(function(dbCards) {
        _.forEach(dbCards, function(dbCard) {
            var card = _.find(cards, { id: dbCard.id });
            if (card) {
                card.ranks = dbCard.ranks.slice();
                card.updated = dbCard.updated;
            }
        });

        _.forEach(cards, function(card) {
            _playableCardsHash[card.id] = card;
        });

        _playableNeutralCards = getPlayableCardsByClass('neutral');

        deferred.resolve();
    }, function(err) {
        console.log(err);
    });

    return deferred.promise;
};

var getCardRankForClass = function(card, theClass) {
    switch (theClass) {
        case 'neutral':
            return card.ranks[_neutralIdx];
        case 'druid':
            return card.ranks[_druidIdx];
        case 'hunter':
            return card.ranks[_hunterIdx];
        case 'mage':
            return card.ranks[_mageIdx];
        case 'paladin':
            return card.ranks[_paladinIdx];
        case 'priest':
            return card.ranks[_priestIdx];
        case 'rogue':
            return card.ranks[_rogueIdx];
        case 'shaman':
            return card.ranks[_shamanIdx];
        case 'warlock':
            return card.ranks[_warlockIdx];
        case 'warrior':
            return card.ranks[_warriorIdx];
        default:
            console.log('Class not found: ' + theClass);
            return null;
    }
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

//    if (process.env.NODE_ENV !== 'production') {
//        randomMana = 6;
//    }

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

    if (_saveCounter === 25) {
        dbProvider.saveUpdatedCards(_playableCards);
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
    var cards = getPlayableCards();
    var ids = _.pluck(cards, 'id');
    dbProvider.getCardsByIds(ids).then(function(dbCards) {
        var rankedCards = require('./data/rankedCardsList.js');
        var rankDatas = rankedCardsList.cardList;
        var minCardDatas = _.map(rankDatas, function(data) {
            var avgRank = 	_.reduce(data.ranks, function(sum, num)
            {
                return sum + num;
            }, 0) / data.ranks.length;

            return {
                id: data.id,
                rank: avgRank
            };
        });
        _.forEach(minCardDatas, function(minCardData) {
            var card = _.find(cards, { id: minCardData.id });
            if (card) {
                card.ranks = [];
                var dbCard = _.find(dbCards, { id: minCardData.id });
                var newRanks = [0,0,0,0,0,0,0,0,0,0];
                switch (card.hero) {
                    case 'neutral':
                        newRanks[_neutralIdx] = dbCard ? dbCard.neutralRank : minCardData.rank;
                        break;
                    case 'druid':
                        newRanks[_druidIdx] = minCardData.rank;
                        break;
                    case 'hunter':
                        newRanks[_hunterIdx] = minCardData.rank;
                        break;
                    case 'mage':
                        newRanks[_mageIdx] = minCardData.rank;
                        break;
                    case 'paladin':
                        newRanks[_paladinIdx] = minCardData.rank;
                        break;
                    case 'priest':
                        newRanks[_priestIdx] = minCardData.rank;
                        break;
                    case 'rogue':
                        newRanks[_rogueIdx] = minCardData.rank;
                        break;
                    case 'shaman':
                        newRanks[_shamanIdx] = minCardData.rank;
                        break;
                    case 'warlock':
                        newRanks[_warlockIdx] = minCardData.rank;
                        break;
                    case 'warrior':
                        newRanks[_warriorIdx] = minCardData.rank;
                        break;
                    default:
                        console.log('Hero not found: ' + card.hero);
                        break;
                }
                card.ranks = newRanks.slice();
                card.updated = new Date();
            }
        });
        dbProvider.saveUpdatedCards(_playableCards);
    });
};

exports.initialize = initialize;
exports.getCardRankForClass = getCardRankForClass;
exports.getTwoRandomNeutralCards = getTwoRandomNeutralCards;
exports.getPlayableCardsByClass = getPlayableCardsByClass;
exports.resetCardRanks = resetCardRanks;
exports.saveAllCards = saveAllCards;
exports.setNeutralRank = setNeutralRank;
