'use strict';
define(function (require) {
    var router = require('plugins/router');
    var dialog = require('plugins/dialog');

    return {
        router: router,
        activate: function () {
            dialog.MessageBox.setDefaults({ 'class': 'customMessageBox' });

            router.map([
                { route: '', title:'Welcome', moduleId: 'viewmodels/welcome', nav: true },
                { route: 'pairRanking', title:'Rank Cards', moduleId: 'viewmodels/pairRanking', nav: true },
                { route: 'arenaRank', title:'Arena Rank', moduleId: 'viewmodels/arenaRank', nav: true },
                { route: 'stats', title: 'Card Reports', moduleId: 'viewmodels/stats', nav: true }
            ]).buildNavigationModel();
            
            return router.activate();
        }
    };
});