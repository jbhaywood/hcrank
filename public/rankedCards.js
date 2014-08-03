'use strict';
var viewModel = (function() {
    var cards = ko.observableArray();

    var loadCards = function() {
        var urlBits = window.location.href.split('/');
        var urlClass = urlBits[urlBits.length - 1];
        $.post('/api/getcards/', { class: urlClass }, function(data) {
            cards.push.apply(cards, data.cards);
        });
    };

    var initialize = function() {
        loadCards();
    };

    return {
        cards: cards,
        initialize: initialize
    };
}());

$(document).ready(function() {
    ko.applyBindings(viewModel);
    viewModel.initialize();
});