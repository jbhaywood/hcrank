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
    this.matchupTotals = defaultTotals.slice();
    this.winTotals = defaultTotals.slice();
    this.updated = new Date();
}

var getClassIdx = function(className) {
    var idx = classList.indexOf(className);
    if (idx === -1) {
        console.log('Class not found (getClassIdx): ' + className);
    }
    return idx;
};

CardData.prototype.getRankForClass = function(className) {
    if (!className) {
        className = this.class;
    }
    var idx = getClassIdx(className);
    return this.ranks[idx];
};

CardData.prototype.getMatchupTotalForClass = function(className) {
    if (!className) {
        className = this.class;
    }
    var idx = getClassIdx(className);
    return this.matchupTotals[idx];
};

CardData.prototype.getWinTotalForClass = function(className) {
    if (!className) {
        className = this.class;
    }
    switch (className) {
        case 'neutral':
            return this.winTotals[neutralIdx];
        case 'druid':
            return this.winTotals[druidIdx];
        case 'hunter':
            return this.winTotals[hunterIdx];
        case 'mage':
            return this.winTotals[mageIdx];
        case 'paladin':
            return this.winTotals[paladinIdx];
        case 'priest':
            return this.winTotals[priestIdx];
        case 'rogue':
            return this.winTotals[rogueIdx];
        case 'shaman':
            return this.winTotals[shamanIdx];
        case 'warlock':
            return this.winTotals[warlockIdx];
        case 'warrior':
            return this.winTotals[warriorIdx];
        default:
            console.log('Class not found (getWinTotalForClass): ' + className);
            return null;
    }
};

CardData.prototype.getWinRatioForClass = function(className) {
    if (!className) {
        className = this.class;
    }
    switch (className) {
        case 'neutral':
            return this.matchupTotals[neutralIdx] ?
                Math.round(this.winTotals[neutralIdx] / this.matchupTotals[neutralIdx] * 100) : 0;
        case 'druid':
            return this.matchupTotals[druidIdx] ?
                Math.round(this.winTotals[druidIdx] / this.matchupTotals[druidIdx] * 100) : 0;
        case 'hunter':
            return this.matchupTotals[hunterIdx] ?
                Math.round(this.winTotals[hunterIdx] / this.matchupTotals[hunterIdx] * 100) : 0;
        case 'mage':
            return this.matchupTotals[mageIdx] ?
                Math.round(this.winTotals[mageIdx] / this.matchupTotals[mageIdx] * 100) : 0;
        case 'paladin':
            return this.matchupTotals[paladinIdx] ?
                Math.round(this.winTotals[paladinIdx] / this.matchupTotals[paladinIdx] * 100) : 0;
        case 'priest':
            return this.matchupTotals[priestIdx] ?
                Math.round(this.winTotals[priestIdx] / this.matchupTotals[priestIdx] * 100) : 0;
        case 'rogue':
            return this.matchupTotals[rogueIdx] ?
                Math.round(this.winTotals[rogueIdx] / this.matchupTotals[rogueIdx] * 100) : 0;
        case 'shaman':
            return this.matchupTotals[shamanIdx] ?
                Math.round(this.winTotals[shamanIdx] / this.matchupTotals[shamanIdx] * 100) : 0;
        case 'warlock':
            return this.matchupTotals[warlockIdx] ?
                Math.round(this.winTotals[warlockIdx] / this.matchupTotals[warlockIdx] * 100) : 0;
        case 'warrior':
            return this.matchupTotals[warriorIdx] ?
                Math.round(this.winTotals[warriorIdx] / this.matchupTotals[warriorIdx] * 100) : 0;
        default:
            console.log('Class not found (getWinRatioForClass): ' + className);
            return null;
    }
};

CardData.prototype.setMatchupTotalForClass = function(className) {
    if (!className) {
        className = this.class;
    }
    switch (className) {
        case 'neutral':
            this.matchupTotals[neutralIdx] = this.matchupTotals[neutralIdx] + 1;
            break;
        case 'druid':
            this.matchupTotals[druidIdx] = this.matchupTotals[druidIdx] + 1;
            break;
        case 'hunter':
            this.matchupTotals[hunterIdx] = this.matchupTotals[hunterIdx] + 1;
            break;
        case 'mage':
            this.matchupTotals[mageIdx] = this.matchupTotals[mageIdx] + 1;
            break;
        case 'paladin':
            this.matchupTotals[paladinIdx] = this.matchupTotals[paladinIdx] + 1;
            break;
        case 'priest':
            this.matchupTotals[priestIdx] = this.matchupTotals[priestIdx] + 1;
            break;
        case 'rogue':
            this.matchupTotals[rogueIdx] = this.matchupTotals[rogueIdx] + 1;
            break;
        case 'shaman':
            this.matchupTotals[shamanIdx] = this.matchupTotals[shamanIdx] + 1;
            break;
        case 'warlock':
            this.matchupTotals[warlockIdx] = this.matchupTotals[warlockIdx] + 1;
            break;
        case 'warrior':
            this.matchupTotals[warriorIdx] = this.matchupTotals[warriorIdx] + 1;
            break;
        default:
            console.log('Class not found (setWinTotalForClass): ' + className);
    }
};

CardData.prototype.setWinTotalForClass = function(className) {
    if (!className) {
        className = this.class;
    }
    switch (className) {
        case 'neutral':
            this.winTotals[neutralIdx] = this.winTotals[neutralIdx] + 1;
            break;
        case 'druid':
            this.winTotals[druidIdx] = this.winTotals[druidIdx] + 1;
            break;
        case 'hunter':
            this.winTotals[hunterIdx] = this.winTotals[hunterIdx] + 1;
            break;
        case 'mage':
            this.winTotals[mageIdx] = this.winTotals[mageIdx] + 1;
            break;
        case 'paladin':
            this.winTotals[paladinIdx] = this.winTotals[paladinIdx] + 1;
            break;
        case 'priest':
            this.winTotals[priestIdx] = this.winTotals[priestIdx] + 1;
            break;
        case 'rogue':
            this.winTotals[rogueIdx] = this.winTotals[rogueIdx] + 1;
            break;
        case 'shaman':
            this.winTotals[shamanIdx] = this.winTotals[shamanIdx] + 1;
            break;
        case 'warlock':
            this.winTotals[warlockIdx] = this.winTotals[warlockIdx] + 1;
            break;
        case 'warrior':
            this.winTotals[warriorIdx] = this.winTotals[warriorIdx] + 1;
            break;
        default:
            console.log('Class not found (setWinTotalForClass): ' + className);
    }
};

CardData.prototype.setRankForClass = function(className, rank) {
    switch (className) {
        case 'neutral':
            this.ranks[neutralIdx] = rank;
            break;
        case 'druid':
            this.ranks[druidIdx] = rank;
            break;
        case 'hunter':
            this.ranks[hunterIdx] = rank;
            break;
        case 'mage':
            this.ranks[mageIdx] = rank;
            break;
        case 'paladin':
            this.ranks[paladinIdx] = rank;
            break;
        case 'priest':
            this.ranks[priestIdx] = rank;
            break;
        case 'rogue':
            this.ranks[rogueIdx] = rank;
            break;
        case 'shaman':
            this.ranks[shamanIdx] = rank;
            break;
        case 'warlock':
            this.ranks[warlockIdx] = rank;
            break;
        case 'warrior':
            this.ranks[warriorIdx] = rank;
            break;
        default:
            console.log('Class not found: ' + className);
            break;
    }
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
