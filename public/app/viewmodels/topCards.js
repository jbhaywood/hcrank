'use strict';
define(function(require) {
    var classList = [ 'Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
    var _ = require('lodash');
    var ko = require('knockout');
    var topCards = ko.observableArray();
    var previewUrl = ko.observable('');
    var curClass = ko.observable('');
    var _fadeDuration = 500; // half second
    var _fadeDelay = 10000; // ten seconds

    var beginUpdate = function() {
        $('#topCards').fadeOut(_fadeDuration, continueUpdate);
    };

    var continueUpdate = function() {
        var className = getNextClass();
        getCards(className).done(function(data) {
            curClass(className);
            updateTopCards(data.data);
            $('#topCards').fadeIn(_fadeDuration, function() {
                setTimeout(beginUpdate, _fadeDelay);
            });
        });
    };

    var getNextClass = function() {
        var className = curClass();

        if (!className) {
            className = _.sample(classList);
        } else {
            var idx = _.indexOf(classList, curClass());
            var nextIdx = idx === classList.length - 1 ? 0 : idx + 1;
            className = classList[nextIdx];
        }

        return className;
    };

    var getCards = function(className) {
        return $.post('/api/getcards/', { class: className, numCards: 10 });
    };

    var updateTopCards = function(cards) {
        topCards().length = 0;
        for (var i = 0; i < 10; i = i + 1) {
            var cardData = cards[i];
            topCards.push({
                name: cardData.name,
                url: cardData.url,
                category: cardData.category,
                index: i + 1
            });
        }
        previewUrl(topCards()[0].url);
    };

    var updatePreview = function(card) {
        previewUrl(card.url);
    };

    return {
        currentClass: curClass,
        topCards: topCards,
        previewUrl: previewUrl,
        updatePreview: updatePreview,
        activate: function() {
            topCards.push({url: '', index:0, name:'', category:''});
            beginUpdate();
            return true;
        }
    };
});