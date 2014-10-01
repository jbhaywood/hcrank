'use strict';
var path = require('path');
var cardsData = require('./cardsData');

exports.initialize = function(router) {
    router.get('/classrank/:class/', function(req, res) {
        var params = req.params;
        var pClass = params.class;
        if (cardsData.classList.indexOf(pClass) !== -1) {
            var file = path.join(__dirname, '../public/rankedCards.html');
            res.sendfile(file);
        }
    });
};