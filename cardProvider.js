'use strict';
var _ = require('lodash');
var Q = require('q');
var dbProvider = require('./dbProvider');
var allCardsRawData = require('./data/all-cards.json');

var _cardDatas = [];
var _cardDatasHash = {};
var _saveCounter = 0;
var _defaultTotals = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

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
    this.rarity = rarity === 'free' ? 'common' : rarity;
    this.ranks = [ 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300 ];
    this.matchupTotals = _defaultTotals.slice();
    this.winTotals = _defaultTotals.slice();
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
            console.log('Class not found (getRankForClass): ' + cardClass);
            return null;
    }
};

CardData.prototype.getMatchupTotalForClass = function(cardClass) {
    if (!cardClass) {
        cardClass = this.class;
    }
    switch (cardClass) {
        case 'neutral':
            return this.matchupTotals[neutralIdx];
        case 'druid':
            return this.matchupTotals[druidIdx];
        case 'hunter':
            return this.matchupTotals[hunterIdx];
        case 'mage':
            return this.matchupTotals[mageIdx];
        case 'paladin':
            return this.matchupTotals[paladinIdx];
        case 'priest':
            return this.matchupTotals[priestIdx];
        case 'rogue':
            return this.matchupTotals[rogueIdx];
        case 'shaman':
            return this.matchupTotals[shamanIdx];
        case 'warlock':
            return this.matchupTotals[warlockIdx];
        case 'warrior':
            return this.matchupTotals[warriorIdx];
        default:
            console.log('Class not found (getMatchupTotalForClass): ' + cardClass);
            return null;
    }
};

CardData.prototype.getWinTotalForClass = function(cardClass) {
    if (!cardClass) {
        cardClass = this.class;
    }
    switch (cardClass) {
        case 'neutral':
            return this.winTotals[neutralIdx];
        case 'druid':
            return this.winTotals[druidIdx];
        case 'hunter':
            return this.winTotals[hunterIdx];
        case 'mage':
            return this.winTotals[mageIdx];
        case 'paladin':
            return this.winTotals[paladinIdx];
        case 'priest':
            return this.winTotals[priestIdx];
        case 'rogue':
            return this.winTotals[rogueIdx];
        case 'shaman':
            return this.winTotals[shamanIdx];
        case 'warlock':
            return this.winTotals[warlockIdx];
        case 'warrior':
            return this.winTotals[warriorIdx];
        default:
            console.log('Class not found (getWinTotalForClass): ' + cardClass);
            return null;
    }
};

CardData.prototype.setMatchupTotalForClass = function(cardClass) {
    if (!cardClass) {
        cardClass = this.class;
    }
    switch (cardClass) {
        case 'neutral':
            this.matchupTotals[neutralIdx] = this.matchupTotals[neutralIdx] + 1;
            break;
        case 'druid':
            this.matchupTotals[druidIdx] = this.matchupTotals[druidIdx] + 1;
            break;
        case 'hunter':
            this.matchupTotals[hunterIdx] = this.matchupTotals[hunterIdx] + 1;
            break;
        case 'mage':
            this.matchupTotals[mageIdx] = this.matchupTotals[mageIdx] + 1;
            break;
        case 'paladin':
            this.matchupTotals[paladinIdx] = this.matchupTotals[paladinIdx] + 1;
            break;
        case 'priest':
            this.matchupTotals[priestIdx] = this.matchupTotals[priestIdx] + 1;
            break;
        case 'rogue':
            this.matchupTotals[rogueIdx] = this.matchupTotals[rogueIdx] + 1;
            break;
        case 'shaman':
            this.matchupTotals[shamanIdx] = this.matchupTotals[shamanIdx] + 1;
            break;
        case 'warlock':
            this.matchupTotals[warlockIdx] = this.matchupTotals[warlockIdx] + 1;
            break;
        case 'warrior':
            this.matchupTotals[warriorIdx] = this.matchupTotals[warriorIdx] + 1;
            break;
        default:
            console.log('Class not found (setWinTotalForClass): ' + cardClass);
    }
};

CardData.prototype.setWinTotalForClass = function(cardClass) {
    if (!cardClass) {
        cardClass = this.class;
    }
    switch (cardClass) {
        case 'neutral':
            this.winTotals[neutralIdx] = this.winTotals[neutralIdx] + 1;
            break;
        case 'druid':
            this.winTotals[druidIdx] = this.winTotals[druidIdx] + 1;
            break;
        case 'hunter':
            this.winTotals[hunterIdx] = this.winTotals[hunterIdx] + 1;
            break;
        case 'mage':
            this.winTotals[mageIdx] = this.winTotals[mageIdx] + 1;
            break;
        case 'paladin':
            this.winTotals[paladinIdx] = this.winTotals[paladinIdx] + 1;
            break;
        case 'priest':
            this.winTotals[priestIdx] = this.winTotals[priestIdx] + 1;
            break;
        case 'rogue':
            this.winTotals[rogueIdx] = this.winTotals[rogueIdx] + 1;
            break;
        case 'shaman':
            this.winTotals[shamanIdx] = this.winTotals[shamanIdx] + 1;
            break;
        case 'warlock':
            this.winTotals[warlockIdx] = this.winTotals[warlockIdx] + 1;
            break;
        case 'warrior':
            this.winTotals[warriorIdx] = this.winTotals[warriorIdx] + 1;
            break;
        default:
            console.log('Class not found (setWinTotalForClass): ' + cardClass);
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

var getTwoRandomCardsInternal = function(cards, className) {
    var sorted;
    // if there are enough cards, make sure all them get matched up more or less evenly
    if (cards.length > 4) {
        // sort cards so that the ones with the fewest matchups are first
        sorted = _.sortBy(cards, function(cardData) {
            return cardData.getMatchupTotalForClass(className);
        });
        // only the first quarter
        sorted.length = Math.ceil(sorted.length / 4);
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
                card.matchupTotals = dbCard.matchupTotals && dbCard.matchupTotals.length > 0 ?
                    dbCard.matchupTotals.slice() : _defaultTotals.slice();
                card.winTotals = dbCard.winTotals && dbCard.winTotals.length > 0 ?
                    dbCard.winTotals.slice() : _defaultTotals.slice();
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

var getFilteredCards = function(includeClasses) {
    var randomInd;
    var randomMana;

    var cards = _.filter(_cardDatas, function(card) {
        return (_.contains(includeClasses, card.class));
    });

    // pick cards either by rarity or mana
    var pickByMana = Math.random() < 0.5;

    if (pickByMana) {
        // skew the randomMana result towards the more common mana values
        var manaVals = _.pluck(cards, 'mana');
        randomInd = Math.floor(Math.random() * manaVals.length);
        randomMana = manaVals[randomInd];

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
    } else {
        var rarities = [1,1,1,1,2,2,2,3,3,4];
        var randomRarity = Math.floor(Math.random() * rarities.length);
        var rarity;
        switch (randomRarity) {
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

        cards = _.filter(cards, function(card) {
            return (card.rarity === rarity);
        });
    }

    if (cards.length < 2) {
        return getFilteredCards(includeClasses);
    } else {
        return cards;
    }
};

var getTwoRandomCards = function(includeClasses, cardHistory) {
    var className = includeClasses.length === 1 ? includeClasses[0] : _.find(includeClasses, function(className) {
        return className !== 'neutral';
    });

    var cards = getFilteredCards(includeClasses, cardHistory);
    var twoCards = getTwoRandomCardsInternal(cards, className);

    var numLoops = 0;
    while (numLoops < 20 && (_.contains(cardHistory, twoCards.cardOne.id) || _.contains(cardHistory, twoCards.cardTwo.id))) {
        numLoops = numLoops + 1;
        twoCards = getTwoRandomCards(includeClasses, cardHistory);
    }

    return {
        cardOne: twoCards.cardOne,
        cardTwo: twoCards.cardTwo
    };
};

var saveAllCards = function() {
    _saveCounter = _saveCounter + 1;

    var saveCount = process.env.NODE_ENV === 'production' ? 10 : 1;
    if (_saveCounter > saveCount) {
        dbProvider.saveUpdatedCards(_cardDatas);
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
