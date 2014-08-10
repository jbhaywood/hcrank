'use strict';
var viewModel = (function() {
    function FilterData(name, displayName, url, activeDefault) {
        this.name = name;
        this.displayName = displayName;
        this.url = url;
        this.isActive = ko.observable(activeDefault);
        this.storageKey = name + '_active';

        this.loadSettings = function() {
            if (Modernizr.localstorage) {
                var isActive = localStorage[this.storageKey];
                if (isActive === undefined) {
                    isActive = activeDefault;
                    localStorage[this.storageKey] = isActive;
                } else {
                    isActive = isActive === 'true';
                }
                this.isActive(isActive);
            }
        };

        this.setActive = function(isActive) {
            this.isActive(isActive);
            if (Modernizr.localstorage) {
                localStorage[this.storageKey] = isActive;
            }
        };

        this.isNeutralOrCommon = function() {
            return this.name === 'neutral' || this.name === 'common';
        };
    }

    var _classDatas = [
        new FilterData('neutral', 'Neutral', '', false),
        new FilterData('druid', 'Malfurion',
            'http://media-hearth.cursecdn.com/avatars/80/382/621.png', false),
        new FilterData('hunter', 'Rexxar',
            'http://media-hearth.cursecdn.com/avatars/80/381/484.png', false),
        new FilterData('mage', 'Jaina',
            'http://media-hearth.cursecdn.com/avatars/80/384/320.png', false),
        new FilterData('paladin', 'Uther',
            'http://media-hearth.cursecdn.com/avatars/80/380/257.png', false),
        new FilterData('priest', 'Anduin',
            'http://media-hearth.cursecdn.com/avatars/80/385/110.png', false),
        new FilterData('rogue', 'Valeera',
            'http://media-hearth.cursecdn.com/avatars/80/380/257.png', false),
        new FilterData('shaman', 'Thrall',
            'http://media-hearth.cursecdn.com/avatars/80/378/319.png', false),
        new FilterData('warlock', 'Gul\'dan',
            'http://media-hearth.cursecdn.com/avatars/80/383/618.png', false),
        new FilterData('warrior', 'Garrosh',
            'http://media-hearth.cursecdn.com/avatars/80/377/635.png', false)
    ];

    var _rarityNames = [
        'Common',
        'Rare',
        'Epic',
        'Legendary'
    ];

    var _rarityDatas = _.map(_rarityNames, function(name) {
        return new FilterData(name.toLocaleLowerCase(), name, '', true);
    });

    var _scoreKey = 'score';
    var _currentMana = 0;
    var _currentMatchupClass = '';

    var _heroData = ko.observable('');
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
        showHeroImage();
        newMatchup();
    };
    
    var cardOneClick = function() {
        processMatchup(_cardOneData(), _cardTwoData());
    };
    
    var cardTwoClick = function() {
        processMatchup(_cardTwoData(), _cardOneData());
    };

    var showHeroImage = function() {
        var heroData = _.find(_classDatas, function(classData) {
            return classData.isActive() && !classData.isNeutralOrCommon();
        });

        if (heroData) {
            _heroData(heroData);
        }
    };

    var filterButtonClick = function(filterData) {
        // process clicks from class filter buttons
        // make sure only one hero is on at a time
        var clickedClassData = _.find(_classDatas, function(classData) {
            return classData.name === filterData.name;
        });

        if (clickedClassData) {
            if (!clickedClassData.isNeutralOrCommon()) {
                _.chain(_classDatas)
                    .filter(function(classData) {
                        return !classData.isNeutralOrCommon() &&
                            classData.name !== clickedClassData.name && classData.isActive();
                    })
                    .forEach(function(classData) {
                        classData.setActive(false);
                    });
            }

            clickedClassData.setActive(!clickedClassData.isActive());

            if (_.all(_classDatas, function(classData) { return !classData.isActive(); })) {
                clickedClassData.setActive(true);
            }
        }

        // process clicks from rarity filter buttons
        // make sure at least one is on at all times
        var clickedRarityData = _.find(_rarityDatas, function(rarityData) {
            return rarityData.name === filterData.name;
        });

        if (clickedRarityData) {
            clickedRarityData.setActive(!clickedRarityData.isActive());

            if (_.all(_rarityDatas, function(rarityData) { return !rarityData.isActive(); })) {
                clickedRarityData.setActive(true);
            }
        }

        var activeClasses = _.filter(_classDatas, function(heroData) {
            return heroData.isActive();
        });

        // if only one hero class is selected, make sure all the rarities are selected
        // otherwise, there aren't enough cards of the same mana to compare
        if (activeClasses.length === 1 && !activeClasses[0].isNeutralOrCommon()) {
            _.forEach(_rarityDatas, function(rarityData) {
                rarityData.setActive(true);
            });
        }

        if (clickedClassData.name !== filterData.name) {
            showHeroImage();
            clearMatchup();
            newMatchup();
        }
    };
    
    var loadSettings = function() {
        if (Modernizr.localstorage) {
            var localScore = parseInt(localStorage[_scoreKey], 10);
            if (!isNaN(localScore)) {
                _score(localScore);
            }

            // class filter button are off by default
            _.forEach(_classDatas, function(classData) {
                classData.loadSettings();
            });

            // rarity filter buttons are on by default
            _.forEach(_rarityDatas, function(rarityData) {
                rarityData.loadSettings();
            });

            // make sure that one class filter button is active
            if (_.all(_classDatas, function(classData) {
                return !classData.isActive();
            })) {
                //noinspection JSUnresolvedFunction
                var first = _.first(_classDatas);
                if (first) {
                    first.setActive(true);
                }
            }
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
        var rankOne = cardOne.currentRank;
        var rankTwo = cardTwo.currentRank;
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
        var rarities = _.chain(_rarityDatas)
            .filter(function(rarityData) {
                return rarityData.isActive();
            })
            .map(function(rarityData) {
                return rarityData.name;
            })
            .value();

        var classes = _.chain(_classDatas)
            .filter(function(classData) {
                return classData.isActive();
            })
            .map(function(classData) {
                return classData.name;
            })
            .value();

        var sendData = {
            manaSkip: _currentMana,
            rarities: rarities,
            classes: classes
            };

        $.post('/api/newmatchup/', sendData, function(data) {
            setImageUrl(data.cardOne, 'original');
            setImageUrl(data.cardTwo, 'original');
            _cardOneData(data.cardOne);
            _cardTwoData(data.cardTwo);
            _currentMana = data.mana;
            _currentMatchupClass = data.class;
            setMatchupText(data.cardOne, data.cardTwo);
            _matchupStartTime = new Date().getTime();
        });
    };

    var processMatchup = function(pickedCard, unpickedCard) {
        var matchupStopTime = new Date().getTime();
        var decisionTime = matchupStopTime - _matchupStartTime;
        var pickedRank = pickedCard.currentRank;
        var unpickedRank = unpickedCard.currentRank;
        var pickedBest = pickedRank > unpickedRank;

        _matchupText(pickedBest ? 'The crowd agrees' : 'The crowd does not agree');
        setScore(pickedBest);
        clearMatchup();

        var saveMatchupSendStr = '/api/savematchup/' + pickedCard.id +
            '/' + unpickedCard.id + '/' + pickedCard.currentRank +
            '/' + unpickedCard.currentRank + '/' + decisionTime + '/' + _currentMatchupClass;
        $.get(saveMatchupSendStr);

        setTimeout(function() {
            newMatchup();
        }, 1000);
    };

    return {
        filterButtonClick: filterButtonClick,
        cardOneData: _cardOneData,
        cardTwoData: _cardTwoData,
        cardOneClick: cardOneClick,
        cardTwoClick: cardTwoClick,
        matchupText: _matchupText,
        matchupSubtext: _matchupSubtext,
        initialize: initialize,
        score: _score,
        rank: userRank,
        classes: _classDatas,
        rarities: _rarityDatas,
        heroData: _heroData
    };
}());

$(document).ready(function() {
//    localStorage.clear();
    viewModel.initialize();
    ko.applyBindings(viewModel);
});