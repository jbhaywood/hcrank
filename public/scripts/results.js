'use strict';
var viewModel = (function() {
    var selectedClass = ko.observable('neutral');
    var classes = [ 'neutral', 'druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];
    var table;

    var initialize = function() {
        update();
    };

    var update = function() {
        if (table) {
            table.ajax.reload();
        } else {
            table = $('#table_id').dataTable({
                serverSide: true,
                paging: false,
                searching: false,
                ordering: false,
//                order: [ 2, 'desc' ],
                ajax: {
                    'url': '/api/getcards/',
                    'type': 'POST',
                    'data': function(d) {
                        d.class = selectedClass();
                    },
                    'dataType': 'json'
                },
                columns: [
                    { data: 'name', title: 'Name' },
                    { data: 'rank', title: 'Rank' },
                    { data: 'totalMatchups', title: 'Total Matchups' },
                    { data: 'totalWins', title: 'Total Wins' }
                ]
            });
        }
    };

    return {
        initialize: initialize,
        classes: classes,
        selectedClass: selectedClass,
        update: update
    };
}());

$(document).ready( function () {
    viewModel.initialize();
    ko.applyBindings(viewModel);
} );