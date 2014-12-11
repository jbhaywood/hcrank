'use strict';
define(function (require) {
    //localStorage.clear();

    var app = require('durandal/app');
    var ko = require('knockout');
    var Modernizr = require('modernizr');
    var FilterData = require('filterdata');

    var _versionKey = 'version';
    var _userIdKey = 'userid';
    var _totalPicksKey = 'totalpicks';
    var _totalWinsKey = 'totalwins';
    var _avgPickTimeKey = 'averagepicktime';
    var _currentClassIndexKey = 'currentclassindex';
    var _classOrderKey = 'classorder';

    var _curVersion = 2;
    var _userId;
    var _totalPicks = ko.observable(0);
    var _totalWins = ko.observable(0);
    var _averagePickTime = ko.observable(0);
    var _customClassDatas = ko.observableArray();
    var _currentClassData = ko.observable('');
    var _nextClassData = ko.observable('');
    var _heroUnlockLevels = [0,10,25,50,75,100,125,150,175,200];
    //var _heroUnlockLevels = [0,3,5,9,12,15,20,22,26];
    var _curClassIdx = 0;
    var _curUnlockedIdx = ko.observable(0);

    var _heroDatas = [
        new FilterData('druid', 'Malfurion', false,
            'http://media-hearth.cursecdn.com/avatars/128/6/621.png'),
        new FilterData('hunter', 'Rexxar', false,
            'http://media-hearth.cursecdn.com/avatars/128/3/484.png'),
        new FilterData('mage', 'Jaina', false,
            'http://media-hearth.cursecdn.com/avatars/128/12/320.png'),
        new FilterData('paladin', 'Uther', false,
            'http://media-hearth.cursecdn.com/avatars/128/0/257.png'),
        new FilterData('priest', 'Anduin', false,
            'http://media-hearth.cursecdn.com/avatars/128/15/110.png'),
        new FilterData('rogue', 'Valeera', false,
            'http://media-hearth.cursecdn.com/avatars/127/997/2.png'),
        new FilterData('shaman', 'Thrall', false,
            'http://media-hearth.cursecdn.com/avatars/127/994/319.png'),
        new FilterData('warlock', 'Gul\'dan', false,
            'http://media-hearth.cursecdn.com/avatars/128/9/618.png'),
        new FilterData('warrior', 'Garrosh', false,
            'http://media-hearth.cursecdn.com/avatars/127/991/635.png')
    ];

    var guidGenerator = function() {
        var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };

        return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
    };

    if (Modernizr.localstorage) {
        var version = localStorage[_versionKey];
        if (!version || version < _curVersion) {
            localStorage.clear();
            localStorage[_versionKey] = 2;
        }

        // randomize class order
        _curClassIdx = localStorage[_currentClassIndexKey];
        var orderStr = localStorage[_classOrderKey];
        var reorderedDatas = [];
        if (!_curClassIdx) {
            _curClassIdx = 0;
            orderStr = '';
            var heroDatasCopy = _heroDatas.slice();
            while (heroDatasCopy.length !== 0) {
                var tempIdx = Math.floor(Math.random() * heroDatasCopy.length);
                var heroDataCopy = heroDatasCopy[tempIdx];
                var heroIdx = _heroDatas.indexOf(heroDataCopy);
                orderStr = orderStr + heroIdx.toString();
                reorderedDatas.push(heroDataCopy);
                heroDatasCopy.splice(tempIdx, 1);
            }
            _userId = guidGenerator();
            localStorage[_userIdKey] = _userId;
            localStorage[_currentClassIndexKey] = 0;
            localStorage[_classOrderKey] = orderStr;
        } else {
            _userId = localStorage[_userIdKey];
            _curClassIdx = parseInt(_curClassIdx);
            _.forEach(orderStr, function(char) {
                var idx = parseInt(char);
                reorderedDatas.push(_heroDatas[idx]);
            });
        }

        _.forEach(reorderedDatas, function(classData) {
            classData.loadSettings();
            _customClassDatas().push(classData);
        });

        // make sure that one class filter button is active
        if (_.all(_customClassDatas(), function(classData) {
                return !classData.isActive();
            })) {
            var first = _.first(_customClassDatas());
            if (first) {
                first.setActive(true);
            }
        }

        // load user data
        var apt = parseInt(localStorage[_avgPickTimeKey], 10);
        if (!isNaN(apt)) {
            _averagePickTime(apt);
        }
        var tp = parseInt(localStorage[_totalPicksKey], 10);
        if (!isNaN(tp)) {
            _totalPicks(tp);
        }
        var tw = parseInt(localStorage[_totalWinsKey], 10);
        if (!isNaN(tw)) {
            _totalWins(tw);
        }

        // set locked heroes based on total picks
        if (_totalPicks() > 0) {
            var unlockLevel = _.find(_heroUnlockLevels, function(level) {
                return _totalPicks() < level;
            });
            _curUnlockedIdx(unlockLevel ? _heroUnlockLevels.indexOf(unlockLevel) - 1 : _heroUnlockLevels.length - 1);
        }

        for (var j = 0; j < _customClassDatas().length; j = j + 1) {
            var isLocked = j > _curUnlockedIdx();
            _customClassDatas()[j].isLocked(isLocked);
        }

        var nextHero = _.find(_customClassDatas(), function(classData) {
            return classData.isLocked();
        });

        _nextClassData(nextHero);
    } else {
        _customClassDatas().push(_heroDatas) ;
    }

    var _userRank = ko.computed(function() {
        var localScore = _totalPicks();
        var localRank;

        if (localScore < 50) {
            localRank = 'Basic';
        } else if (localScore >= 50 && localScore < 250) {
            localRank = 'Common';
        } else if (localScore >= 250 && localScore < 1000) {
            localRank = 'Rare';
        } else if (localScore >= 1000 && localScore < 5000) {
            localRank = 'Epic';
        } else if (localScore >= 5000) {
            localRank = 'Legendary';
        }
        return localRank;
    });

    var _winPercent = ko.computed(function() {
        var per = _totalWins() /  _totalPicks() * 100;
        return Math.ceil(per || 0) + '%';
    });

    var _picksToNextHero = ko.computed(function() {
        var n = 0;
        if (_curUnlockedIdx() < _heroUnlockLevels.length - 1) {
            var nextUnlockLevel = _heroUnlockLevels[_curUnlockedIdx() + 1];
            n = nextUnlockLevel - _totalPicks();
        } else {
            n = undefined;
        }
        return n;
    });

    var saveUserData = function() {
        if (Modernizr.localstorage) {
            localStorage[_totalPicksKey] = _totalPicks();
            localStorage[_totalWinsKey] = _totalWins();
            localStorage[_avgPickTimeKey] = _averagePickTime();
            localStorage[_currentClassIndexKey] = _curClassIdx;
        }

        var sendData = {
            userId: _userId,
            totalPicks: _totalPicks,
            totalWins: _totalWins,
            averagePickTime: _averagePickTime,
            unlockLevel: _curUnlockedIdx
        };

        $.post('/api/saveuserdata/', sendData, function() { });
    };

    var unlockHero = function() {
        var nxtIdx = _curUnlockedIdx() + 1;
        if (nxtIdx <= _customClassDatas().length - 1) {
            if (_totalPicks() >= _heroUnlockLevels[nxtIdx]) {
                _customClassDatas()[nxtIdx].isLocked(false);
                _curUnlockedIdx(nxtIdx);

                app.showMessage('You just unlocked ' + _customClassDatas()[nxtIdx].displayName +
                '.  Keep ranking cards to unlock the rest.', 'Congratulations!' );

                var nextHero = _customClassDatas()[nxtIdx + 1];
                if (nextHero) {
                    _nextClassData(nextHero);
                }
            }
        }
    };

    var updateAndSave = function(pickedBest, decisionTime) {
        _totalPicks(_totalPicks() + 1);

        if (pickedBest === undefined || pickedBest) {
            _totalWins(_totalWins() + 1);
        }

        if (_averagePickTime() === 0) {
            _averagePickTime(decisionTime);
        } else {
            _averagePickTime((_averagePickTime() + decisionTime) / 2);
        }

        unlockHero();
        saveUserData();
    };

    var updateCurrentHero = function() {
        var curClass = _.find(_customClassDatas(), function(classData) {
            return classData.isActive();
        });

        if (!curClass) {
            curClass = _.first(_customClassDatas());
            curClass.setActive(true);
        }

        _currentClassData(curClass);
    };

    return {
        totalPicks: _totalPicks,
        totalWins: _totalWins,
        averagePickTime: _averagePickTime,
        picksToNextHero: _picksToNextHero,
        winPercent: _winPercent,
        userRank: _userRank,
        currentHero: _currentClassData,
        nextHero: _nextClassData,
        classDatas: _customClassDatas,
        userId: _userId,
        updateAndSave: updateAndSave,
        updateCurrentHero: updateCurrentHero,

        activate: function() {
            return true;
        }
    };
});
