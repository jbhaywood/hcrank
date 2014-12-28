'use strict';
requirejs.config({
    paths: {
        durandal:'../lib/durandal/js',
        plugins : '../lib/durandal/js/plugins',
        transitions : '../lib/durandal/js/transitions',
        text: [
            'https://cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text',
            '../lib/require/text'
        ],
        knockout: [
            'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.1.0/knockout-min',
            '../lib/knockout/knockout-3.1.0'
        ],
        lodash: [
            'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min',
            '../lib/externals/lodash-modern-2.4.1.min'
        ],
        jquery: [
            'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min',
            '../lib/jquery/jquery-2.1.1.min'
        ],
        datatables: [
            'https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.2/js/jquery.dataTables.min',
            '../lib/externals/jquery.dataTables.min'
        ],
        modernizr: [
            'https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min',
            '../lib/externals/modernizr-custom-2.8.3.min'
        ],
        filterdata: '../app/data/filterData',
        userdata: '../app/data/userData'
    },
    shim: {
        modernizr: {
            exports: 'Modernizr'
        },
        lodash: {
            exports: '_'
        }
    }
});

define(['durandal/system', 'durandal/app', 'durandal/viewLocator', 'durandal/composition'],  function (system, app, viewLocator) {
    system.debug(true);

    app.title = 'HearthCrowdRank';

    app.configurePlugins({
        router: true,
        dialog: true
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