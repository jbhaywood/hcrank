'use strict';
var viewModel = (function() {
    var _scoreKey = 'hcrank_score';
    var _commonActiveKey = 'hcrank_commonActive';
    var _rareActiveKey = 'hcrank_rareActive';
    var _epicActiveKey = 'hcrank_epicActive';
    var _legendaryActiveKey = 'hcrank_legendaryActive';
    var _currentMana = 0;

    var _commonActive = ko.observable(true);
    var _rareActive = ko.observable(true);
    var _epicActive = ko.observable(true);
    var _legendaryActive = ko.observable(true);
    var _score = ko.observable(0);
    var _matchupText = ko.observable('');
    var _matchupSubtext = ko.observable('');
    var _cardOneData = ko.observable({});
    var _cardTwoData = ko.observable({});
    var _matchupStartTime;
    
    var userRank = ko.computed(function() {
        var localScore = _score();
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
        loadSettings();
        newMatchup();
    };
    
    var cardOneClick = function() {
        processMatchup(_cardOneData(), _cardTwoData());
    };
    
    var cardTwoClick = function() {
        processMatchup(_cardTwoData(), _cardOneData());
    };

    var filterButtonClick = function(name) {
        switch (name) {
            case 'common':
                _commonActive(!_commonActive());
                if (Modernizr.localstorage) {
                    localStorage[_commonActiveKey] = _commonActive();
                }
                break;
            case 'rare':
                _rareActive(!_rareActive());
                if (Modernizr.localstorage) {
                    localStorage[_rareActiveKey] = _rareActive();
                }
                break;
            case 'epic':
                _epicActive(!_epicActive());
                if (Modernizr.localstorage) {
                    localStorage[_epicActiveKey] = _epicActive();
                }
                break;
            case 'legendary':
                _legendaryActive(!_legendaryActive());
                if (Modernizr.localstorage) {
                    localStorage[_legendaryActiveKey] = _legendaryActive();
                }
                break;
        }

        if (!_commonActive() && !_rareActive() && !_epicActive() && !_legendaryActive()) {
            filterButtonClick(name);
        }
    };
    
    var loadSettings = function() {
        if (Modernizr.localstorage) {
            var localScore = parseInt(localStorage[_scoreKey], 10);
            if (!isNaN(localScore)) {
                _score(localScore);
            }

            var commonActive = localStorage[_commonActiveKey];
            var rareActive = localStorage[_rareActiveKey];
            var epicActive = localStorage[_epicActiveKey];
            var legendaryActive = localStorage[_legendaryActiveKey];
            _commonActive(commonActive === undefined ? true : commonActive === 'true');
            _rareActive(rareActive === undefined ? true : rareActive === 'true');
            _epicActive(epicActive === undefined ? true : epicActive === 'true');
            _legendaryActive(legendaryActive === undefined ? true : legendaryActive === 'true');
        }
    };
    
    var setScore = function(pickedBest) {
        var currentScore = _score();
        if (pickedBest) {
            _score(currentScore + 1);
        } else if (currentScore > 0) {
            _score(currentScore - 1);
        }

        if (Modernizr.localstorage) {
            localStorage[_scoreKey] = _score();
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
            _matchupSubtext('(careful, this one\'s tricky)');
        } else if (rankDiff < 50) {
            _matchupSubtext('(hmm...)');
        } else {
            _matchupSubtext('(piece of cake)');
        }

        _matchupText('Choose wisely');
    };

    var clearMatchup = function() {
        _cardOneData({});
        _cardTwoData({});
        _matchupSubtext('...');
    };

    var newMatchup = function() {
        var rarities = [];
        if (_commonActive()) {
            rarities.push('common');
        }
        if (_rareActive()) {
            rarities.push('rare');
        }
        if (_epicActive()) {
            rarities.push('epic');
        }
        if (_legendaryActive()) {
            rarities.push('legendary');
        }

        var sendData = {
            manaSkip: _currentMana,
            rarities: rarities
        };

        $.post('/api/newmatchup/', sendData, function(data) {
            setImageUrl(data.cardOne, 'original');
            setImageUrl(data.cardTwo, 'original');
            _cardOneData(data.cardOne);
            _cardTwoData(data.cardTwo);
            _currentMana = data.mana;
            setMatchupText(data.cardOne, data.cardTwo);
            _matchupStartTime = new Date().getTime();
        });
    };

    var processMatchup = function(pickedCard, unpickedCard) {
        var matchupStopTime = new Date().getTime();
        var decisionTime = matchupStopTime - _matchupStartTime;
        var pickedRank = pickedCard.neutralRank;
        var unpickedRank = unpickedCard.neutralRank;
        var pickedBest = pickedRank > unpickedRank;

        pickedCard.neutralRank = ((100 - pickedRank) / 2) + pickedRank;
        unpickedCard.neutralRank = unpickedRank - (unpickedRank / 2);
        _matchupText(pickedBest ? 'The crowd agrees' : 'The crowd does not agree');
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
        commonActive: _commonActive,
        rareActive: _rareActive,
        epicActive: _epicActive,
        legendaryActive: _legendaryActive,
        filterButtonClick: filterButtonClick,
        cardOneData: _cardOneData,
        cardTwoData: _cardTwoData,
        cardOneClick: cardOneClick,
        cardTwoClick: cardTwoClick,
        matchupText: _matchupText,
        matchupSubtext: _matchupSubtext,
        initialize: initialize,
        score: _score,
        rank: userRank
    };
}());

$(document).ready(function() {
    ko.applyBindings(viewModel);
    viewModel.initialize();
});