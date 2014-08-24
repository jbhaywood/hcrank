'use strict';
var _ = require('lodash');
var Q = require('q');
var dbProvider = require('./dbProvider');
var allCardsRawData = require('./data/all-cards.json');

var _cardDatas = [];
var _cardDatasHash = {};
var _saveCounter = 0;

var neutralIdx = 0;
var druidIdx = 1;
var hunterIdx = 2;
var mageIdx = 3;
var paladinIdx = 4;
var priestIdx = 5;
var rogueIdx = 6;
var shamanIdx = 7;
var warlockIdx = 8;
var warriorIdx = 9;

var classList = [ 'neutral', 'druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];

function CardData(name, id, cardClass, mana, url, rarity) {
    this.name = name;
    this.id = id;
    this.class = cardClass;
    this.mana = mana;
    this.url = url;
    this.rarity = rarity;
    this.ranks = [ 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300 ];
    this.totalMatchups = 0;
    this.totalWins = 0;
    this.updated = new Date();
}

CardData.prototype.getRankForClass = function(cardClass) {
    if (!cardClass) {
        cardClass = this.class;
    }
    switch (cardClass) {
        case 'neutral':
            return this.ranks[neutralIdx];
        case 'druid':
            return this.ranks[druidIdx];
        case 'hunter':
            return this.ranks[hunterIdx];
        case 'mage':
            return this.ranks[mageIdx];
        case 'paladin':
            return this.ranks[paladinIdx];
        case 'priest':
            return this.ranks[priestIdx];
        case 'rogue':
            return this.ranks[rogueIdx];
        case 'shaman':
            return this.ranks[shamanIdx];
        case 'warlock':
            return this.ranks[warlockIdx];
        case 'warrior':
            return this.ranks[warriorIdx];
        default:
            console.log('Class not found: ' + cardClass);
            return null;
    }
};

CardData.prototype.setRankForClass = function(cardClass, rank) {
    switch (cardClass) {
        case 'neutral':
            this.ranks[neutralIdx] = rank;
            break;
        case 'druid':
            this.ranks[druidIdx] = rank;
            break;
        case 'hunter':
            this.ranks[hunterIdx] = rank;
            break;
        case 'mage':
            this.ranks[mageIdx] = rank;
            break;
        case 'paladin':
            this.ranks[paladinIdx] = rank;
            break;
        case 'priest':
            this.ranks[priestIdx] = rank;
            break;
        case 'rogue':
            this.ranks[rogueIdx] = rank;
            break;
        case 'shaman':
            this.ranks[shamanIdx] = rank;
            break;
        case 'warlock':
            this.ranks[warlockIdx] = rank;
            break;
        case 'warrior':
            this.ranks[warriorIdx] = rank;
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

    // add rankings to cards
    var ids = _.pluck(cards, 'id');
    dbProvider.getCardsByIds(ids).then(function(dbCards) {
        _.forEach(dbCards, function(dbCard) {
            var card = _.find(cards, { id: dbCard.id });
            if (card) {
                card.ranks = dbCard.ranks.slice();
                card.updated = dbCard.updated;
                card.totalMatchups = dbCard.totalMatchups ? dbCard.totalMatchups : 0;
                card.totalWins = dbCard.totalWins ? dbCard.totalWins : 0;
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

var getFilteredCards = function(includeClasses, includeRarities, manasSkip) {
    var randomInd;
    var randomMana;
    var numLoops = 0;

    var cards = _.filter(_cardDatas, function(card) {
        return (_.contains(includeClasses, card.class) && _.contains(includeRarities, card.rarity));
    });

    // skew the randomMana result towards the more common mana values
    var manaVals = _.pluck(cards, 'mana');

    do {
        randomInd = Math.floor(Math.random() * manaVals.length);
        randomMana = manaVals[randomInd];
        numLoops = numLoops + 1;
    } while ( numLoops < 50 && _.contains(manasSkip, randomMana) );

    // group all mana cost cards greater than 10 with the 10 cards
    // and any zero cost cards with the one mana cards
    if (randomMana > 10) {
        randomMana = 10;
    } else if (randomMana < 1) {
        randomMana = 1;
    }

    cards = _.filter(cards, function(card) {
        return ((randomMana > 1 && randomMana < 10 && card.mana === randomMana) ||
            (randomMana >= 10 && card.mana >= 10) ||
            (randomMana <= 1 && card.mana <= 1));
    });

    if (cards.length < 2) {
        return getFilteredCards(includeClasses, includeRarities, manasSkip);
    } else {
        return cards;
    }
};

var getTwoRandomCards = function(includeClasses, includeRarities, manasSkip) {
    var cards = getFilteredCards(includeClasses, includeRarities, manasSkip);
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

var setCardRank = function(cardId, rank, cardClass, cardWon) {
    var card = _cardDatasHash[cardId];
    if (card) {
        card.setRankForClass(cardClass, rank);
        card.totalMatchups = card.totalMatchups + 1;
        card.totalWins = cardWon ? card.totalWins + 1 : card.totalWins;
        card.updated = new Date();
    }
};

exports.initialize = initialize;
exports.getCardDatas = getCardDatas;
exports.getCardDatasByClass = getCardDatasByClass;
exports.getTwoRandomCards = getTwoRandomCards;
exports.saveAllCards = saveAllCards;
exports.setCardRank = setCardRank;
exports.classList = classList;
exports.neutralIdx = neutralIdx;
exports.druidIdx = druidIdx;
exports.hunterIdx = hunterIdx;
exports.mageIdx = mageIdx;
exports.paladinIdx = paladinIdx;
exports.priestIdx = priestIdx;
exports.rogueIdx = rogueIdx;
exports.shamanIdx = shamanIdx;
exports.warlockIdx = warlockIdx;
exports.warriorIdx = warriorIdx;
