'use strict';
requirejs.config({
    paths: {
        'text': '../lib/require/text',
        'durandal':'../lib/durandal/js',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',
        'knockout': '../lib/knockout/knockout-3.1.0',
        'jquery': '../lib/jquery/jquery-2.1.1.min',
        'datatables': '../lib/externals/jquery.dataTables.min',
        'modernizr': '../lib/externals/modernizr-custom-2.8.3.min',
        'lodash': '../lib/externals/lodash-modern-2.4.1.min',
        'filterdata': '../app/data/filterData',
        'userdata': '../app/data/userData'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'modernizr': {
            exports: 'Modernizr'
        },
        'lodash': {
            exports: '_'
        }
    }
});

define(['durandal/system', 'durandal/app', 'durandal/viewLocator', 'durandal/composition'],  function (system, app, viewLocator) {
    system.debug(true);

    app.title = 'HearthCrowdRank';

    app.configurePlugins({
        router: true
    });

    app.start().then(function() {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        //Show the app by setting the root view model for our application with a transition.
//        app.setRoot('viewmodels/shell', 'entrance');
        app.setRoot('viewmodels/shell');
    });
});