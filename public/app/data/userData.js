'use strict';
define(function (require) {
    localStorage.clear();

    var ko = require('knockout');
    var Modernizr = require('modernizr');
    var FilterData = require('filterdata');

    var _totalPicksKey = 'totalpicks';
    var _totalWinsKey = 'totalwins';
    var _avgPickTimeKey = 'averagepicktime';
    var _currentClassIndexKey = 'currentclassindex';
    var _currentUnlockedIndexKey = 'currentunlockedindex';
    var _classOrderKey = 'classlocked';

    var _totalPicks = ko.observable(0);
    var _totalWins = ko.observable(0);
    var _averagePickTime = ko.observable(0);
    var _customClassDatas = ko.observableArray();
    var _currentClassData = ko.observable('');
    var _heroUnlockLevels = [0,50,100,150,200,250,300,350,400,450];
    //var _heroUnlockLevels = [0,2,4,6,8,10,12,14,16];
    var _curClassIdx = 0;
    var _curUnlockedIdx = ko.observable(0);

    var _classDatas = [
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

    if (Modernizr.localstorage) {
        // randomize class order
        _curClassIdx = localStorage[_currentClassIndexKey];
        var unlockedIdx = localStorage[_currentUnlockedIndexKey];
        var orderStr = localStorage[_classOrderKey];
        var reorderedList = [];
        if (!_curClassIdx) {
            _curClassIdx = 0;
            unlockedIdx = 0;
            orderStr = '';
            var tempList = _classDatas.slice();
            while (tempList.length !== 0) {
                var idx = Math.floor(Math.random() * tempList.length);
                var hero = tempList[idx];
                var heroIdx = _classDatas.indexOf(hero);
                orderStr = orderStr + heroIdx.toString();
                reorderedList.push(hero);
                tempList.splice(idx, 1);
            }
            localStorage[_currentClassIndexKey] = 0;
            localStorage[_classOrderKey] = orderStr;
        } else {
            _curClassIdx = parseInt(_curClassIdx);
            unlockedIdx = parseInt(_curUnlockedIdx);
            _.forEach(orderStr, function(char) {
                var idx = parseInt(char);
                reorderedList.push(_classDatas[idx]);
            });
        }

        _curUnlockedIdx(unlockedIdx);
        for (var j = 0; j < reorderedList.length; j = j + 1) {
            var isLocked = j > _curUnlockedIdx();
            reorderedList[j].isLocked(isLocked);
        }
        _.forEach(reorderedList, function(classData) {
            _customClassDatas().push(classData);
        });

        _.forEach(_customClassDatas(), function(classData) {
            classData.loadSettings();
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
    } else {
        _customClassDatas().push(_classDatas) ;
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
            localStorage[_currentUnlockedIndexKey] = _curUnlockedIdx();
        }
    };

    var unlockHero = function() {
        var nxtIdx = _curUnlockedIdx() + 1;
        if (nxtIdx <= _customClassDatas().length - 1) {
            if (_totalPicks() >= _heroUnlockLevels[nxtIdx]) {
                _customClassDatas()[nxtIdx].isLocked(false);
                _curUnlockedIdx(nxtIdx);
            }
        }
    };

    var updatePickData = function(pickedBest, decisionTime) {
        _totalPicks(_totalPicks() + 1);

        if (pickedBest) {
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
        classDatas: _customClassDatas,
        updatePickData: updatePickData,
        updateCurrentHero: updateCurrentHero,

        activate: function() {
            return true;
        }
    };
});
