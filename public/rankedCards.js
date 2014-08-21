'use strict';
var viewModel = (function() {
    var _originalCardOrder = [];
    var cards = ko.observableArray();

    var initialize = function() {
        loadCards();
    };

    var loadCards = function() {
        var urlBits = window.location.href.split('/');
        var urlClass = urlBits[urlBits.length - 1];
        $.post('/api/getcards/', { class: urlClass }, function(data) {
            _originalCardOrder = data.cards.slice();
            cards.push.apply(cards, data.cards);
        });
    };

    var save = function() {
        var currentCardOrder = cards();
        for (var i = 0; i < currentCardOrder.length; i = i + 1) {
            var curIdx = i;
            var origIdx = _originalCardOrder.indexOf(currentCardOrder[i]);
            var range = Math.abs(curIdx - origIdx);
            var percentChange = range / currentCardOrder.length * 100;
            percentChange = curIdx <= origIdx ? percentChange : -percentChange;
            console.log(currentCardOrder[i].name, percentChange);
        }
    };

    var reset = function() {
        cards.removeAll();
        cards.push.apply(cards, _originalCardOrder);
    };

    return {
        cards: cards,
        initialize: initialize,
        save: save,
        reset: reset
    };
}());

$(document).ready(function() {
    viewModel.initialize();
    ko.applyBindings(viewModel);
});