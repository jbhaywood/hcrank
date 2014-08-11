'use strict';
var _ = require('lodash');
var Q = require('q');
var dbProvider = require('./dbProvider');
var allCardsRawData = require('./data/all-cards.json');

var _cardDatas = [];
var _cardDatasHash = {};
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

function CardData(name, id, cardClass, mana, url, rarity) {
    this.name = name;
    this.id = id;
    this.class = cardClass;
    this.mana = mana;
    this.url = url;
    this.rarity = rarity;
    this.ranks = [ 0,0,0,0,0,0,0,0,0,0 ];
    this.updated = new Date();
}

CardData.prototype.getRankForClass = function(cardClass) {
    switch (cardClass) {
        case 'neutral':
            return this.ranks[_neutralIdx];
        case 'druid':
            return this.ranks[_druidIdx];
        case 'hunter':
            return this.ranks[_hunterIdx];
        case 'mage':
            return this.ranks[_mageIdx];
        case 'paladin':
            return this.ranks[_paladinIdx];
        case 'priest':
            return this.ranks[_priestIdx];
        case 'rogue':
            return this.ranks[_rogueIdx];
        case 'shaman':
            return this.ranks[_shamanIdx];
        case 'warlock':
            return this.ranks[_warlockIdx];
        case 'warrior':
            return this.ranks[_warriorIdx];
        default:
            console.log('Class not found: ' + cardClass);
            return null;
    }
};

CardData.prototype.setRankForClass = function(cardClass, rank) {
    switch (cardClass) {
        case 'neutral':
            this.ranks[_neutralIdx] = rank;
            break;
        case 'druid':
            this.ranks[_druidIdx] = rank;
            break;
        case 'hunter':
            this.ranks[_hunterIdx] = rank;
            break;
        case 'mage':
            this.ranks[_mageIdx] = rank;
            break;
        case 'paladin':
            this.ranks[_paladinIdx] = rank;
            break;
        case 'priest':
            this.ranks[_priestIdx] = rank;
            break;
        case 'rogue':
            this.ranks[_rogueIdx] = rank;
            break;
        case 'shaman':
            this.ranks[_shamanIdx] = rank;
            break;
        case 'warlock':
            this.ranks[_warlockIdx] = rank;
            break;
        case 'warrior':
            this.ranks[_warriorIdx] = rank;
            break;
        default:
            console.log('Class not found: ' + cardClass);
            break;
    }
};

var getCardDatas = function() {
    if (_cardDatas.length === 0) {
        var rawDatas = _.filter(allCardsRawData.cards, function(card) {
            return card.collectible && card.category !== 'ability' && card.category !== 'hero';
        });
        _cardDatas = _.map(rawDatas, function(data) {
            return new CardData(data.name, data.id, data.hero, data.mana, data.image_url, data.quality);
        });
    }
    return _cardDatas;
};

var getCardDatasByClass = function(className) {
    var cards = getCardDatas();
    return _.where(cards, { class: className });
};

var getTwoRandomCardsInternal = function(cards) {
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
    var cards = getCardDatas();

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
            _cardDatasHash[card.id] = card;
        });

        deferred.resolve();
    }, function(err) {
        console.log(err);
    });

    return deferred.promise;
};

var getFilteredCards = function(includeClasses, includeRarities, manaSkip) {
    var randomInd;
    var randomMana;

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

    var cards = _.filter(_cardDatas, function(card) {
        return ((randomMana > 1 && randomMana < 10 && card.mana === randomMana) ||
            (randomMana >= 10 && card.mana >= 10) ||
            (randomMana <= 1 && card.mana <= 1)) &&
            _.contains(includeClasses, card.class) &&
            _.contains(includeRarities, card.rarity);
    });

    if (cards.length < 2) {
        return getFilteredCards(includeClasses, includeRarities, manaSkip);
    } else {
        return cards;
    }
};

var getTwoRandomCards = function(includeClasses, includeRarities, manaSkip) {
    var cards = getFilteredCards(includeClasses, includeRarities, manaSkip);
    var twoCards = getTwoRandomCardsInternal(cards);

    return {
        cardOne: twoCards.cardOne,
        cardTwo: twoCards.cardTwo,
        mana: twoCards.cardOne.mana
    };
};

var saveAllCards = function() {
    _saveCounter = _saveCounter + 1;

    var saveCount = process.env.NODE_ENV === 'production' ? 5 : 1;
    if (_saveCounter === saveCount) {
        dbProvider.saveUpdatedCards(_cardDatas);
        _saveCounter = 0;
    }
};

var setCardRank = function(cardId, rank, cardClass) {
    var card = _cardDatasHash[cardId];
    if (card) {
        card.setRankForClass(cardClass, rank);
        card.updated = new Date();
    }
};

var resetCardRanks = function (){
    var cards = getCardDatas();
    var ids = _.pluck(cards, 'id');
    dbProvider.getCardsByIds(ids).then(function(dbCards) {
        var rankedCards = require('./data/rankedCardsList.js');
        var rankDatas = rankedCards.cardList;
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
                switch (card.class) {
                    case 'neutral':
                        newRanks[_neutralIdx] = dbCard ? dbCard.ranks[_neutralIdx] : minCardData.rank;
                        break;
                    case 'druid':
                        newRanks[_druidIdx] = dbCard ? dbCard.ranks[_druidIdx] : minCardData.rank;
                        break;
                    case 'hunter':
                        newRanks[_hunterIdx] = dbCard ? dbCard.ranks[_hunterIdx] : minCardData.rank;
                        break;
                    case 'mage':
                        newRanks[_mageIdx] = dbCard ? dbCard.ranks[_mageIdx] : minCardData.rank;
                        break;
                    case 'paladin':
                        newRanks[_paladinIdx] = dbCard ? dbCard.ranks[_paladinIdx] : minCardData.rank;
                        break;
                    case 'priest':
                        newRanks[_priestIdx] = dbCard ? dbCard.ranks[_priestIdx] : minCardData.rank;
                        break;
                    case 'rogue':
                        newRanks[_rogueIdx] = dbCard ? dbCard.ranks[_rogueIdx] : minCardData.rank;
                        break;
                    case 'shaman':
                        newRanks[_shamanIdx] = dbCard ? dbCard.ranks[_shamanIdx] : minCardData.rank;
                        break;
                    case 'warlock':
                        newRanks[_warlockIdx] = dbCard ? dbCard.ranks[_warlockIdx] : minCardData.rank;
                        break;
                    case 'warrior':
                        newRanks[_warriorIdx] = dbCard ? dbCard.ranks[_warriorIdx] : minCardData.rank;
                        break;
                    default:
                        console.log('Hero not found: ' + card.class);
                        break;
                }
                card.ranks = newRanks.slice();
                card.updated = new Date();
            }
        });
        dbProvider.saveUpdatedCards(_cardDatas);
    });
};

exports.initialize = initialize;
exports.getTwoRandomCards = getTwoRandomCards;
exports.getCardDatasByClass = getCardDatasByClass;
exports.resetCardRanks = resetCardRanks;
exports.saveAllCards = saveAllCards;
exports.setCardRank = setCardRank;
