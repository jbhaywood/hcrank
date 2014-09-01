'use strict';
var viewModel = (function() {
    var selectedClass = ko.observable('neutral');
    var classes = [ 'neutral', 'druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];
    var table;

    var initialize = function() {
        update();
    };

    var update = function() {
        $.post('/api/getcards/', { class: selectedClass() }, function(data) {
            if (table) {
                table.clear();
                table.rows.add(data.data);
                table.draw();
            } else {
                table = $('#table_id').DataTable({
                    data: data.data,
                    paging: false,
                    searching: false,
                    order: [ 1, 'desc' ],
                    columns: [
                        { data: 'name', title: 'Name' },
                        { data: 'rank', title: 'Rank' },
                        { data: 'totalMatchups', title: 'Total Matchups', visible: false },
                        { data: 'totalWins', title: 'Total Wins', visible: false },
                        { render: function(data, type, row, meta)
                            {
                                return (row.totalMatchups ? (row.totalWins / row.totalMatchups * 100).toFixed(2) : 0) + '%';
                            }, title: 'Win Ratio' }
                    ]
                });
            }
        });
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