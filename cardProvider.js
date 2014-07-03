var _ = require('lodash');
var _allCardsData = require('./data/all-cards.json');

var _allCards =  _allCardsData.cards;
var _manaVals = [];
var _cardHeroes = [];
var _playableCards;

var getPlayableCards = function() {
    if (!_playableCards) {
        _playableCards = _.filter(_allCards, function(card) {
           return card.collectible === true && card.type !== 'ability' && card.type !== 'hero'; 
        });
    }
    return _playableCards;
};

var getPlayableCardsByHero = function(heroName) {
    return _.where(getPlayableCards(), { hero: heroName });
};

var getPlayableCardsByMana = function(mana) {
    return _.where(getPlayableCards(), { mana: mana });
};

var getTwoRandomCardsByMana = function(mana) {
    var cards = getPlayableCardsByMana(mana);
    return getTwoRandomCards(cards);
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

    // get all the mana values for the purpose of getting
    // a random one weighted by the number of cards per mana cost
    _manaVals = _.pluck(getPlayableCards(), 'mana');
};

var getTwoRandomNeutralCards = function() {
    var randomInd = Math.floor(Math.random() * _manaVals.length);
    var randomMana = _manaVals[randomInd];
    // group all mana cost cards greater than 10 with the 10 cards
    if (randomMana > 10) {
        randomMana = 10;
    }
    var cards = _.filter(getPlayableCardsByHero('neutral'), function(card) {
        return (randomMana < 10 && card.mana === randomMana) ||  (randomMana >= 10 && card.mana >= 10);
    });
    var twoCards = getTwoRandomCards(cards);
    return {
        cardOne: twoCards.cardOne,
        cardTwo: twoCards.cardTwo,
        mana: randomMana
    };
};

exports.initialize = initialize;
exports.getTwoRandomNeutralCards = getTwoRandomNeutralCards;
