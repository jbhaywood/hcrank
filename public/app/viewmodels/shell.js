'use strict';
define(function (require) {
    var router = require('plugins/router');

    return {
        router: router,
        activate: function () {
            router.map([
                { route: '', title:'Welcome', moduleId: 'viewmodels/welcome', nav: true },
                { route: 'pairRanking', title:'Pair Ranking', moduleId: 'viewmodels/pairRanking', nav: true },
                { route: 'stats', title: 'Card Stats', moduleId: 'viewmodels/stats', nav: true }
            ]).buildNavigationModel();
            
            return router.activate();
        }
    };
});