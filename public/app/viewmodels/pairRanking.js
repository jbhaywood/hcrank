'use strict';
define(function (require) {
    var app = require('durandal/app');
    var _ = require('lodash');
    var ko = require('knockout');
    var UserData = require('userdata');

    var _cardHistory = [];
    var _maxCardHistory = 20;
    var _matchupStartTime;
    var _currentMatchupClass = '';
    var _matchupText = ko.observable('');
    var _matchupSubtext = ko.observable('');
    var _cardOneData = ko.observable({});
    var _cardTwoData = ko.observable({});
    var _hideCards = ko.observable(false);

    var filterButtonClick = function(filterData) {
        // process clicks from class filter buttons
        // make sure only one is on at a time
        var clickedClassData = _.find(UserData.classDatas(), function(classData) {
            return classData.name === filterData.name;
        });

        if (clickedClassData && !clickedClassData.isLocked()) {
            _.forEach(UserData.classDatas(), function(classData) {
                classData.setActive(false);
            });

            clickedClassData.setActive(!clickedClassData.isActive());

            if (_.all(UserData.classDatas(), function(classData) { return !classData.isActive(); })) {
                clickedClassData.setActive(true);
            }

            UserData.updateCurrentHero();
            clearMatchup();
            newMatchup();
        }
    };

    var cardOneClick = function() {
        processMatchup(_cardOneData(), _cardTwoData());
        setTimeout(newMatchup, 1000);
    };

    var cardTwoClick = function() {
        processMatchup(_cardTwoData(), _cardOneData());
        setTimeout(newMatchup, 1000);
    };

    var summaryClick = function() {
        newMatchup();
    };

    var setMatchupText = function(cardOne, cardTwo) {
        var rankOne = cardOne.currentRank;
        var rankTwo = cardTwo.currentRank;
        var rankDiff = Math.abs(rankOne - rankTwo);

        _matchupText('Choose Wisely');

        if (rankDiff < 260) {
            _matchupSubtext('(careful, this one\'s tricky)');
        } else if (rankDiff < 1300) {
            _matchupSubtext('(hmm...)');
        } else {
            _matchupSubtext('(piece of cake)');
        }
    };

    var clearMatchup = function() {
        _hideCards(true);
        _matchupSubtext('');
    };

    var newMatchup = function() {
        var classes = [ 'neutral', UserData.currentHero().name ];

        _cardOneData({ url: ''});
        _cardTwoData({ url: ''});

        var sendData = {
            cardHistory: _cardHistory,
            classes: classes
        };

        return $.post('/api/newmatchup/', sendData, function(data) {
            setMatchupText(data.cardOne, data.cardTwo);
            _cardOneData(data.cardOne);
            _cardTwoData(data.cardTwo);
            _currentMatchupClass = data.class;
            _matchupStartTime = new Date().getTime();
            _hideCards(false);

            // NOTE: automated clicker, used for testing
            //setTimeout(function() {
            //    if (Math.random() < 0.5) {
            //        cardOneClick();
            //    } else {
            //        cardTwoClick();
            //    }
            //}, 100);
        });
    };

    var processMatchup = function(pickedCard, unpickedCard) {
        var matchupStopTime = new Date().getTime();
        var decisionTime = matchupStopTime - _matchupStartTime;
        var pickedRank = pickedCard.rank;
        var unpickedRank = unpickedCard.rank;
        var undecided = pickedCard.unranked || unpickedCard.unranked;
        var pickedBest = undecided ? undefined : pickedRank >= unpickedRank;

        if (_cardHistory.length === _maxCardHistory) {
            _cardHistory.length = _maxCardHistory - 2;
        }

        _cardHistory.unshift(pickedCard.id);
        _cardHistory.unshift(unpickedCard.id);

        if (undecided) {
            _matchupText('The crowd hasn\'t decided yet');
        } else {
            _matchupText(pickedBest ? 'The crowd agrees' : 'The crowd does not agree');
        }

        UserData.updateAndSave(pickedBest, decisionTime);
        clearMatchup();

        var sendData = {
            cardWinnerId: pickedCard.id,
            cardLoserId: unpickedCard.id,
            cardWinnerRank: pickedCard.rank,
            cardLoserRank: unpickedCard.rank,
            milliseconds: decisionTime,
            class: _currentMatchupClass
        };

        $.post('/api/savematchup/', sendData, function() { });
    };

    return {
        filterButtonClick: filterButtonClick,
        summaryClick: summaryClick,
        cardOneClick: cardOneClick,
        cardTwoClick: cardTwoClick,
        cardOneData: _cardOneData,
        cardTwoData: _cardTwoData,
        matchupText: _matchupText,
        matchupSubtext: _matchupSubtext,
        totalPicks: UserData.totalPicks,
        totalWins: UserData.totalWins,
        winPercent: UserData.winPercent,
        averagePickTime: UserData.averagePickTime,
        picksToNextHero: UserData.picksToNextHero,
        rank: UserData.userRank,
        classes: UserData.classDatas,
        currentHero: UserData.currentHero,
        nextHero: UserData.nextHero,
        hideCards: _hideCards,
        displayName: 'Rank Cards',
        activate: function() {
            UserData.updateCurrentHero();
            return newMatchup();
        }
    };
});
