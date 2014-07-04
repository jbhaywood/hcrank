var mongoose = require('mongoose');
var _ = require('lodash');

var Card;
var Matchup;

var _classList = ['druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];
var _defaultClassRanks; 

var initialize = function() {
    var cardSchema = mongoose.Schema({
       id: Number,
       neutralRank: Number,
       classRanks: [Number]
    });
    
    var matchupSchema = mongoose.Schema({
       cardOneId: Number,
       cardTwoId: Number,
       winnerId: Number,
       secondsToDecide: Number
    });
    
    Card = mongoose.model('Card', cardSchema);
    Matchup = mongoose.model('Matchup', matchupSchema);
    
    _defaultClassRanks = _.map(_classList, function() { return 0; });
};

var saveRankedCards = function(cards) {
    initialize().onFulfill(function() {
        if (Card && Matchup) {
            var ranked = require('./rankedCards');
            
            Card.remove({}, function(err) {
              if (err) {
                console.log ('error deleting Card data.');
              }
            });
            
            Matchup.remove({}, function(err) {
              if (err) {
                console.log ('error deleting Matchup data.');
              }
            });

            var cardModels = _.map(ranked.cardList, function(card) {
                    var avgRank = _.reduce(card.ranks, function(sum, num) {
                        return sum + num;
                    }) / card.ranks.length;
                    
                    var minRank = 1;
                    var maxRank = 100;
                    
                    avgRank = Math.ceil(avgRank);
                    avgRank = Math.min(Math.max(avgRank, minRank), maxRank);
                    
                    return new Card({ id: card.id, neutralRank: avgRank, classRanks: _defaultClassRanks });
                });
            
            _.forEach(cardModels, function(cardModel) {
                cardModel.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        }
    });
};

var getRank = function(cardId) {
    var promise = new mongoose.Promise;
    Card.findOne({ id: cardId }, function(err, card) {
        if (!err) {
            promise.fulfill(card.neutralRank);
        } else {
            console.log(err);
        }
    });
    return promise;
};

var setNeutralRank = function(cardId, rank) {
    Card.findOne({ id: cardId }, function(err, card) {
        if (!err) {
            card.neutralRank = rank;
            card.save();
            console.log("cardId: " + cardId + "; saved! Rank = " + card.neutralRank)
        } else {
            console.log(err);
        }
    });
};

var saveMatchup = function(cardOneId, cardTwoId, winnerId, milliseconds) {
    // always order cards by id to make looking up matchups between specific cards easier
    var id1, id2;
    if (cardOneId < cardTwoId) {
        id1 = cardOneId;
        id2 = cardTwoId;
    } else {
        id1 = cardTwoId;
        id2 = cardOneId;
    }
    var matchup = new Matchup({
        cardOneId: id1,
        cardTwoId: id2, 
        winnerId: winnerId, 
        secondsToDecide: (milliseconds / 1000)
    });
    matchup.save();
    console.log("Matchup saved! " + matchup)
}

exports.initialize = initialize;
exports.getRank = getRank;
exports.setNeutralRank = setNeutralRank;
exports.saveMatchup = saveMatchup;