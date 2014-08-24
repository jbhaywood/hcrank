'use strict';
var path = require('path');
var cardProvider = require('../cardProvider');

exports.initialize = function(router) {
    router.get('/results/', function(req, res) {
        res.sendfile(path.join(__dirname, '../public/results.html'));
    });

    router.get('/classrank/:class/', function(req, res) {
        var params = req.params;
        var pClass = params.class;
        if (cardProvider.classList.indexOf(pClass) !== -1) {
            var file = path.join(__dirname, '../public/rankedCards.html');
            res.sendfile(file);
        }
    });
};