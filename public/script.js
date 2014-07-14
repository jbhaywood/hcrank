'use strict';

var viewModel = (function() {
    var storageScoreKey = 'hcrank_score';
    var currentMana = 0;

    var score = ko.observable(0);
    var matchupText = ko.observable('');
    var cardOneData = ko.observable('');
    var cardTwoData = ko.observable('');
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
    
    function cardOneClick() {
        sendMatchupResult(1);
    }
    
    function cardTwoClick() {
        sendMatchupResult(2);
    }
    
    function loadScore() {
        if (Modernizr.localstorage) {
          var localScore = parseInt(localStorage[storageScoreKey], 10);
          if (!isNaN(localScore)) {
              score(localScore);
          }
        }
    }
    
    function setScore(pickedBest) {
        if (pickedBest) {
            score(score() + 1);
        } else if (score() > 0) {
            score(score() - 1);
        }
        
        if (Modernizr.localstorage) {
            localStorage[storageScoreKey] = score();
        }
    }
    
    function sendMatchupResult(cardNum) {
        var matchupStopTime = new Date().getTime();
        var decisionTime = matchupStopTime - matchupStartTime;

        var sendData = { 
            cardOneId: cardOneData().id,
            cardTwoId: cardTwoData().id,
            picked: cardNum === 1 ? 1 : 2,
            time: decisionTime
        };
        
        $.post('/api/sendmatchup/', sendData, function(data) {
            var result = data.pickedBest ? 'The crowd agrees' : 'The crowd does not agree';
            matchupText(result);
            setScore(data.pickedBest);
            setTimeout(function() {
                newMatchup();
            }, 1000);
        });
    }
    
    function newMatchup() {
        var sendData = { manaSkip: currentMana };
        $.post('/api/newmatchup/', sendData, function(data) {
            setImageSize(data.cardOne, 'original');
            setImageSize(data.cardTwo, 'original');
            cardOneData(data.cardOne);
            cardTwoData(data.cardTwo);
            currentMana = data.mana;
            matchupText('Choose wisely');
            matchupStartTime = new Date().getTime();
        });
    }
    
    function setImageSize(card, size) {
        card.image_url = card.image_url.replace('\/medium\/', '\/' + size + '\/');
    }
    
    return {
        cardOneData: cardOneData,
        cardTwoData: cardTwoData,
        cardOneClick: cardOneClick,
        cardTwoClick: cardTwoClick,
        matchupText: matchupText,
        initialize: initialize,
        score: score,
        rank: userRank
    };
}());

$(document).ready(function () {
    ko.applyBindings(viewModel);
    viewModel.initialize();
});