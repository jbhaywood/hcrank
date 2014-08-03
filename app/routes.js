'use strict';
var path = require('path');
var classes = [ 'druid', 'hunter', 'mage', 'neutral', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior' ];

exports.initialize = function(router) {
    router.get('/:class/', function(req, res) {
        var params = req.params;
        var pClass = params.class;
        if (classes.indexOf(pClass) !== -1) {
            var file = path.join(__dirname, '../public/rankedCards.html');
            res.sendfile(file);
        }
    });
};