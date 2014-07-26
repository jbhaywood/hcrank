'use strict';
var viewModel = (function() {
    var storageScoreKey = 'hcrank_score';
    var currentMana = 0;

    var score = ko.observable(0);
    var matchupText = ko.observable('');
    var matchupSubtext = ko.observable('');
    var cardOneData = ko.observable({});
    var cardTwoData = ko.observable({});
    var matchupStartTime;
    
    var userRank = ko.computed(function() {
        var localScore = score();
        var localRank;
        
        if (localScore < 10) {
            localRank = 'Basic';
        } else if (localScore >= 10 && localScore < 100) {
            localRank = 'Common';
        } else if (localScore >= 100 && localScore < 1000) {
            localRank = 'Rare';
        } else if (localScore >= 1000 && localScore < 10000) {
            localRank = 'Epic';
        } else if (localScore >= 10000) {
            localRank = 'Legendary';
        }
        return localRank;
    });

    var initialize = function() {
        loadScore();
        newMatchup();
    };
    
    var cardOneClick = function() {
        processMatchup(cardOneData(), cardTwoData());
    };
    
    var cardTwoClick = function() {
        processMatchup(cardTwoData(), cardOneData());
    };
    
    var loadScore = function() {
        if (Modernizr.localstorage) {
          var localScore = parseInt(localStorage[storageScoreKey], 10);
          if (!isNaN(localScore)) {
              score(localScore);
          }
        }
    };
    
    var setScore = function(pickedBest) {
        var currentScore = score();
        if (pickedBest) {
            score(currentScore + 1);
        } else if (currentScore > 0) {
            score(currentScore - 1);
        }
        
        if (Modernizr.localstorage) {
            localStorage[storageScoreKey] = score();
        }
    };

    var setImageUrl = function(card, size) {
        card.url = card.url.replace('\/medium\/', '\/' + size + '\/');
    };

    var setMatchupText = function(cardOne, cardTwo) {
        var rankOne = cardOne.neutralRank;
        var rankTwo = cardTwo.neutralRank;
        var rankDiff = Math.abs(rankOne - rankTwo);

        if (rankDiff < 10) {
            matchupSubtext('(careful, this one\'s tricky)');
        } else if (rankDiff < 50) {
            matchupSubtext('(hmm...)');
        } else {
            matchupSubtext('(piece of cake)');
        }

        matchupText('Choose wisely');
    };

    var clearMatchup = function() {
        cardOneData({});
        cardTwoData({});
        matchupSubtext('');
    };

    var newMatchup = function() {
        var sendData = { manaSkip: currentMana };

        $.post('/api/newmatchup/', sendData, function(data) {
            setImageUrl(data.cardOne, 'original');
            setImageUrl(data.cardTwo, 'original');
            cardOneData(data.cardOne);
            cardTwoData(data.cardTwo);
            currentMana = data.mana;
            setMatchupText(data.cardOne, data.cardTwo);
            matchupStartTime = new Date().getTime();
        });
    };

    var processMatchup = function(pickedCard, unpickedCard) {
        var matchupStopTime = new Date().getTime();
        var decisionTime = matchupStopTime - matchupStartTime;
        var pickedRank = pickedCard.neutralRank;
        var unpickedRank = unpickedCard.neutralRank;
        var pickedBest = pickedRank > unpickedRank;

        pickedCard.neutralRank = ((100 - pickedRank) / 2) + pickedRank;
        unpickedCard.neutralRank = unpickedRank - (unpickedRank / 2);
        matchupText(pickedBest ? 'The crowd agrees' : 'The crowd does not agree');
        setScore(pickedBest);
        clearMatchup();

        var saveMatchupSendStr = '/api/savematchup/' + pickedCard.id +
            '/' + unpickedCard.id + '/' + pickedCard.neutralRank +
            '/' + unpickedCard.neutralRank + '/' + decisionTime;
        $.get(saveMatchupSendStr);

        setTimeout(function() {
            newMatchup();
        }, 1000);
    };

    return {
        cardOneData: cardOneData,
        cardTwoData: cardTwoData,
        cardOneClick: cardOneClick,
        cardTwoClick: cardTwoClick,
        matchupText: matchupText,
        matchupSubtext: matchupSubtext,
        initialize: initialize,
        score: score,
        rank: userRank
    };
}());

$(document).ready(function() {
    ko.applyBindings(viewModel);
    viewModel.initialize();
});