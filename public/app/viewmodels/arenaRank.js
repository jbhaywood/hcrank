'use strict';
define(function (require) {
    var _ = require('lodash');
    var ko = require('knockout');
    var UserData = require('userdata');
    var _hero = '';
    var _heroOne = ko.observable();
    var _heroTwo = ko.observable();
    var _heroThree = ko.observable();
    var _card1 = ko.observable();
    var _card2 = ko.observable();
    var _card3 = ko.observable();
    var _prevMatchupIds = [];
    var _hideCards = ko.observable(true);
    var _showResults = ko.observable(false);
    var _allMatchups = ko.observableArray();
    var _maxMatchups = 60;
    var _totalMatchupsCount = 30;
    var _curMatchupsCount = 0;
    var _remainingMatchups = ko.observable(_totalMatchupsCount);
    var _hits = ko.observable(0);
    var _matchupStartTime;

    var ArenaRankMatchup = function(card1, card2, card3, pickedCard) {
        this._best = undefined;
        this.card1 = card1;
        this.card2 = card2;
        this.card3 = card3;
        this.picked = pickedCard;
        this.best = function() {
            if (!this._best) {
                this._best = _.sortBy([card1, card2, card3 ], 'rank')[2];
            }
            return this._best;
        };
        this.unpicked = function() {
            var p = this.picked;
            return _.where([card1, card2, card3 ], function(card) {
                return card.id !== p.id;
            });
        };
        this.pickedBest = function() {
            return this.best().id === this.picked.id;
        };
        this.didPick = function(cardNum) {
            switch (cardNum) {
                case 1:
                    return this.card1.id === this.picked.id;
                case 2:
                    return this.card2.id === this.picked.id;
                case 3:
                    return this.card3.id === this.picked.id;
            }
        };
        this.isBest = function(cardNum) {
            switch (cardNum) {
                case 1:
                    return this.best().id === this.card1.id;
                case 2:
                    return this.best().id === this.card2.id;
                case 3:
                    return this.best().id === this.card3.id;
            }
        };
        //noinspection JSUnusedGlobalSymbols
        this.resultCaption = function(cardNum) {
            return this.isBest(cardNum) && this.didPick(cardNum) ? 'Best/Chosen'
                : this.isBest(cardNum) ? 'Best' : this.didPick(cardNum) ? 'Chosen' : '';
        };
    };
    
    var clear = function() {
        _curMatchupsCount = 0;
        _remainingMatchups(_totalMatchupsCount);
        _prevMatchupIds.length = 0;
        _allMatchups.removeAll();
        _hideCards(true);
        _showResults(false);
    };
    
    var initializeHero = function() {
        clear();
        
        var heroes = UserData.getRandomHeroes(3);
        _heroOne(heroes[0]);
        _heroTwo(heroes[1]);
        _heroThree(heroes[2]);
    };

    var heroClick = function(heroIdx) {
        if (heroIdx === 0) {
            _hero = _heroOne();
        } else if (heroIdx === 1) {
            _hero = _heroTwo();
        } else if (heroIdx === 2) {
            _hero = _heroThree;
        }
        newMatchup();
    };

    var cardClick = function(picked) {
        processMatchup(picked);
    };

    var newMatchup = function() {
        var sendData = {
            excludedIds: _prevMatchupIds,
            hero: _hero.name,
            numCards: 3
        };

        return $.post('/api/newmatchup/', sendData, function(data) {
            _matchupStartTime = new Date().getTime();
            _card1(data[0]);
            _card2(data[1]);
            _card3(data[2]);
            _hideCards(false);
        });
    };

    var processAllMatchups = function() {
        _showResults(true);
        var matchupStopTime = new Date().getTime();
        var decisionTime = matchupStopTime - _matchupStartTime;
        var matchupResults = _.countBy(_allMatchups(), function(matchup) {
            return matchup.pickedBest() ? 'hits' : 'misses';
        });
        _hits(matchupResults['hits']); // jshint ignore:line

        var sendData = {
            matchups: _.map(_allMatchups(), function(matchup) {
                return {
                        winnerId: matchup.picked.id,
                        loserIds: _.pluck(matchup.unpicked(), 'id'),
                        milliseconds: decisionTime,
                        hero: _hero.name
                    };
            })};

        $.post('/api/savematchups/', sendData, function() { });
    };

    var resetClick = function() {
        initializeHero();
    };

    var processMatchup = function(picked) {
        if (_prevMatchupIds.length === _maxMatchups) {
            _prevMatchupIds.length = _maxMatchups - 3;
        }

        _prevMatchupIds.unshift(_card1().id);
        _prevMatchupIds.unshift(_card2().id);
        _prevMatchupIds.unshift(_card3().id);

        if (_curMatchupsCount === _totalMatchupsCount) {
            processAllMatchups();
        } else {
            var card1 = _card1();
            var card2 = _card2();
            var card3 = _card3();
            card1.url = card1.url.replace('original', 'medium');
            card2.url = card2.url.replace('original', 'medium');
            card3.url = card3.url.replace('original', 'medium');
            var matchup = new ArenaRankMatchup(card1, card2, card3, picked);
            _allMatchups.push(matchup);
            newMatchup();
        }

        _curMatchupsCount += 1;
        _remainingMatchups(_totalMatchupsCount - _curMatchupsCount);
    };

    return {
        card1: _card1,
        card2: _card2,
        card3: _card3,
        heroOne: _heroOne,
        heroTwo: _heroTwo,
        heroThree: _heroThree,
        heroClick: heroClick,
        cardClick: cardClick,
        resetClick: resetClick,
        hideCards: _hideCards,
        showResults: _showResults,
        remainingMatchups: _remainingMatchups,
        hits: _hits,
        matchups: _allMatchups,
        displayName: 'Arena Rank',
        activate: function () {
            initializeHero();
            return true;
        }
    };
});