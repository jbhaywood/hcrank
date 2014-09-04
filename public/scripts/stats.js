'use strict';
var viewModel = (function() {
    var table;

    function FilterData(name, displayName, activeDefault) {
        this.name = name;
        this.displayName = displayName;
        this.isActive = ko.observable(activeDefault);
    }

    var _classDatas = [
        new FilterData('neutral', 'Neutral', true),
        new FilterData('druid', 'Malfurion', false),
        new FilterData('hunter', 'Rexxar', false),
        new FilterData('mage', 'Jaina', false),
        new FilterData('paladin', 'Uther', false),
        new FilterData('priest', 'Anduin', false),
        new FilterData('rogue', 'Valeera', false),
        new FilterData('shaman', 'Thrall', false),
        new FilterData('warlock', 'Gul\'dan', false),
        new FilterData('warrior', 'Garrosh', false)
    ];

    var initialize = function() {
        update();
    };

    var filterButtonClick = function(filterData) {
        // process clicks from class filter buttons
        // make sure only one is on at a time
        var clickedClassData = _.find(_classDatas, function(classData) {
            return classData.name === filterData.name;
        });

        if (clickedClassData) {
            _.forEach(_classDatas, function(classData) {
                    classData.isActive(false);
                });

            clickedClassData.isActive(!clickedClassData.isActive());
        }

        update();
    };

    var update = function() {
        var activeClass = _.find(_classDatas, function(classData) {
            return classData.isActive();
        });

        $.post('/api/getcards/', { class: activeClass.name }, function(data) {
            if (table) {
                table.clear();
                table.rows.add(data.data);
                table.draw();
            } else {
                var urlBits = window.location.href.split('/');
                var verbose = urlBits[urlBits.length - 1] === 'statsall';

                table = $('#table_id').DataTable({
                    data: data.data,
                    paging: false,
                    searching: false,
                    order: [ 1, 'desc' ],
                    columns: [
                        { data: 'name', title: 'Name' },
                        { data: 'rank', title: 'Rank' },
                        { data: 'totalMatchups', title: 'Total Matchups', visible: verbose },
                        { data: 'totalWins', title: 'Total Wins', visible: verbose },
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
        classes: _classDatas,
        filterButtonClick: filterButtonClick
    };
}());

$(document).ready( function () {
    viewModel.initialize();
    ko.applyBindings(viewModel);
} );