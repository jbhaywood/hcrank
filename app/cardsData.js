'use strict';
var classList = [ 'neutral', 'druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];
var defaultTotals = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
var neutralIdx = 0;
var druidIdx = 1;
var hunterIdx = 2;
var mageIdx = 3;
var paladinIdx = 4;
var priestIdx = 5;
var rogueIdx = 6;
var shamanIdx = 7;
var warlockIdx = 8;
var warriorIdx = 9;

function CardData(name, id, className, mana, url, rarity, setName, category) {
    this.name = name;
    this.id = id;
    this.url = url;
    this.class = className;
    this.mana = mana;
    this.rarity = rarity === 'free' ? 'common' : rarity;
    this.set = setName;
    this.category = category;
    this.ranks = [ 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300, 1300 ];
    this.matchupTotals = defaultTotals.slice(0);
    this.winTotals = defaultTotals.slice(0);
    this.updated = new Date();
}

var getClassIdx = function(className) {
    var idx = classList.indexOf(className);
    if (idx === -1) {
        console.log('Class not found (getClassIdx): ' + className);
    }
    return idx;
};

var getAverageTotalForClass = function(totals, className) {
    var result = 0;

    // get the average of all heroes for 'neutral'
    if (className === 'neutral') {
        var nonZeroCounts = 0;
        for (var i = 0; i < classList.length; i = i + 1) {
            var matchups = totals[i];
            if (matchups > 0) {
                nonZeroCounts = nonZeroCounts + 1;
            }
            result = result + matchups;
        }
        result = nonZeroCounts > 0 ? Math.ceil(result  / nonZeroCounts) : 0;
    } else {
        var idx = getClassIdx(className);
        result = totals[idx];
    }

    return result;
};

CardData.prototype.getValidClass = function(className) {
    return !className || classList.indexOf(className) === -1 ? this.class : className;
};

CardData.prototype.getRankForClass = function(className) {
    className = this.getValidClass(className);
    return getAverageTotalForClass(this.ranks, className);
};

CardData.prototype.getMatchupTotalForClass = function(className) {
    className = this.getValidClass(className);
    return getAverageTotalForClass(this.matchupTotals, className);
};

CardData.prototype.getWinTotalForClass = function(className) {
    className = this.getValidClass(className);
    return getAverageTotalForClass(this.winTotals, className);
};

CardData.prototype.getWinRatioForClass = function(className) {
    className = this.getValidClass(className);
    var matchupTotal = this.getMatchupTotalForClass(className);
    var winTotal = this.getWinTotalForClass(className);
    return matchupTotal ? Math.round(winTotal / matchupTotal * 100) : 0;
};

CardData.prototype.setMatchupTotalForClass = function(className) {
    className = this.getValidClass(className);
    var idx = getClassIdx(className);
    this.matchupTotals[idx] = this.matchupTotals[idx] + 1;
};

CardData.prototype.setWinTotalForClass = function(className) {
    className = this.getValidClass(className);
    var idx = getClassIdx(className);
    this.winTotals[idx] = this.winTotals[idx] + 1;
};

CardData.prototype.setRankForClass = function(rank, className) {
    className = this.getValidClass(className);
    var idx = getClassIdx(className);
    this.ranks[idx] = rank;
};

CardData.prototype.updateRankForClass = function(rank, className, didWin) {
    className = this.getValidClass(className);
    this.setRankForClass(rank, className);
    this.setMatchupTotalForClass(className);
    if (didWin) {
        this.setWinTotalForClass(className);
    }
    this.updated = new Date();
};

exports.getClassIdx = getClassIdx;
exports.CardData = CardData;
exports.defaultTotals = defaultTotals;
exports.neutralIdx = neutralIdx;
exports.druidIdx = druidIdx;
exports.hunterIdx = hunterIdx;
exports.mageIdx = mageIdx;
exports.paladinIdx = paladinIdx;
exports.priestIdx = priestIdx;
exports.rogueIdx = rogueIdx;
exports.shamanIdx = shamanIdx;
exports.warlockIdx = warlockIdx;
exports.warriorIdx = warriorIdx;
exports.classList = classList;
