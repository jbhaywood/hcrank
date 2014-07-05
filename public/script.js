var viewModel = function() {
    var self = this;
    var storageScoreKey = 'hcrank_score';
    var currentMana = 0;
    var firstMatchup = true;

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

    function initialize() {
        loadScore();
        newMatchup();
    }
    
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
        var decisionTime = 0;
        
        // ignore the first matchup because it's going to person isn't totally focused on ranking cards yet 
        if (!firstMatchup) {
            var matchupStopTime = new Date().getTime();
            decisionTime = matchupStopTime - matchupStartTime;
        } else {
            firstMatchup = false;
        }
    
        var sendData = { 
            cardOneId: cardOneData().id,
            cardTwoId: cardTwoData().id,
            picked: cardNum === 1 ? 1 : 2,
            time: decisionTime
        };
        
        $.post('/api/sendmatchup/', sendData, function(data) {
            var result = data.pickedBest ? "The crowd agrees" : "The crowd does not agree";
            matchupText(result);
            setScore(data.pickedBest);
            setTimeout(function() {
                newMatchup();
            }, 1000);
        });
    }
    
    function newMatchup() {
        $.get('/api/newmatchup/', function(data) {
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
        card.image_url = card.image_url.replace("\/medium\/", "\/" + size + "\/");
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
}();

$(document).ready(function () {
    ko.applyBindings(viewModel);
    viewModel.initialize();
});