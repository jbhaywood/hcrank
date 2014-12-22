'use strict';
var _ = require('lodash');
var elo = require('elo-rank')();
var cardProvider = require('./cardProvider');
var dbProvider = require('./dbProvider');

var _minPickCount = 10;

exports.initialize = function(router) {
    router.post('/newmatchup/', function(req, res) {
        var data = req.body;
        var excludedIds = data.excludedIds || [];
        var numCards = parseInt(data.numCards, 10);
        var cards = cardProvider.getRandomCards(data.hero, numCards, excludedIds);
        var sendData = _.map(cards, function(card) {
            return {
                id: card.id,
                name: card.name,
                url: card.url,
                rank: card.getRankForClass(data.hero),
                winRatio: card.getWinRatioForClass(data.hero),
                unranked: card.getMatchupTotalForClass(data.hero) < _minPickCount
            };
        });
        res.send(sendData);
    });

    var intCheck = function(int) {
        return typeof int === 'number' && (int % 1) === 0;
    };

    router.post('/savematchups/', function(req, res) {
        var data = req.body;

        if (data.matchups && data.matchups.length > 0) {
            _.forEach(data.matchups, function(matchup) {
                var winnerId = matchup.winnerId;
                var loserIds = matchup.loserIds;
                var hero = matchup.hero;
                var winnerCard = cardProvider.getCardData(winnerId);
                var loserCards = cardProvider.getCardDatas(loserIds);
                var milliseconds = parseInt(matchup.milliseconds, 10);

                if (!intCheck(milliseconds)) {
                    milliseconds = 0;
                }

                if (winnerCard && loserCards.length !== 0) {
                    elo.setKFactor(Math.ceil(128 / loserCards.length));

                    if (winnerCard && loserCards.length !== 0) {
                        elo.setKFactor(Math.ceil(128 / loserCards.length));
                        var oldWinnerRank = winnerCard.getRankForClass(hero);

                        _.forEach(loserCards, function(loserCard) {
                            var oldLoserRank = loserCard.getRankForClass(hero);

                            var winnerExpected = elo.getExpected(oldWinnerRank, oldLoserRank );
                            var loserExpected = elo.getExpected(oldLoserRank, oldWinnerRank);

                            var newWinnerRank = Math.floor(elo.updateRating(winnerExpected, 1, oldWinnerRank));
                            var newLoserRank = Math.floor(elo.updateRating(loserExpected, 0, oldLoserRank));

                            winnerCard.updateRankForClass(newWinnerRank, hero, true);
                            loserCard.updateRankForClass(newLoserRank, hero, false);
                            dbProvider.saveMatchup(winnerId, loserCard.id, newWinnerRank, newLoserRank, winnerId, hero, milliseconds);
                        });
                    }
                }
            });

            cardProvider.saveAllCards(true);
        }

        res.end();
    });

    router.post('/getcards/', function(req, res) {
        var data = req.body;
        var className = (data.class || 'neutral').toLowerCase();
        var numCards = parseInt(data.numCards, 10);
        var cardDatas = cardProvider.getCardDatasByClass(className);

        var sortedDatas = _.chain(cardDatas)
            .sortBy(function(cardData) {
                return cardData.getRankForClass(className);
            })
            .reverse()
            .map(function(cardData) {
                return {
                    name: cardData.name,
                    class: cardData.class,
                    mana: cardData.mana,
                    totalMatchups: cardData.getMatchupTotalForClass(className),
                    totalWins: cardData.getWinTotalForClass(className),
                    rank: cardData.getRankForClass(className),
                    url: cardData.url,
                    rarity: cardData.rarity,
                    set: cardData.set,
                    category: cardData.category
                };
            })
            .value();

        if (numCards) {
            sortedDatas.length = numCards;
        }

        var sendData = {
            data: sortedDatas
        };

        res.send(sendData);
    });

    router.post('/saveuserdata/', function(req, res) {
        dbProvider.saveUser(req.body);
        res.end();
    });
};