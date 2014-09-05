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

    var _rarityDatas = [
        new FilterData('all', 'All', true),
        new FilterData('common', 'Common', false),
        new FilterData('rare', 'Rare', false),
        new FilterData('epic', 'Epic', false),
        new FilterData('legendary', 'Lengendary', false)
    ];

    var initialize = function() {
        var activeClassData = _.find(_classDatas, function(classData) {
            return classData.isActive();
        });
        updateClass(activeClassData);
    };

    var filterButtonClick = function(filterData) {
        // process clicks from class filter buttons
        // make sure only one is on at a time
        var clickedClassData = _.find(_classDatas, function(classData) {
            return classData.name === filterData.name;
        });

        var clickedRarityData = _.find(_rarityDatas, function(rarityData) {
            return rarityData.name === filterData.name;
        });

        if (clickedClassData) {
            _.forEach(_classDatas, function(classData) {
                    classData.isActive(false);
                });

            clickedClassData.isActive(!clickedClassData.isActive());
            updateClass(clickedClassData);
        }

        if (clickedRarityData) {
            _.forEach(_rarityDatas, function(rarityData) {
                rarityData.isActive(false);
            });

            clickedRarityData.isActive(!clickedRarityData.isActive());
            updateRarity(clickedRarityData);
        }
    };

    var updateClass = function(classData) {
        $.post('/api/getcards/', { class: classData.name }, function(data) {
            if (table) {
                table.clear();
                table.rows.add(data.data);
                table.draw();
            } else {
                var urlBits = window.location.href.split('/');
                var verbose = urlBits[urlBits.length - 1] === 'statsall';

                table = $('#table_id').DataTable({
                    dom: 'lrtip',
                    data: data.data,
                    paging: false,
//                    searching: false,
                    order:  [ 1, 'desc' ],
                    columns: [
                        { data: 'name', title: 'Name' },
                        { data: 'rarity', title: 'Rarity', visible: verbose },
                        { data: 'mana', title: 'Mana', visible: verbose },
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

    var updateRarity = function(rarityData) {
        var searchTerm = rarityData.name === 'all' ? '' : rarityData.name;
        table.search(searchTerm).draw();
    };

    return {
        initialize: initialize,
        classes: _classDatas,
        rarities: _rarityDatas,
        filterButtonClick: filterButtonClick
    };
}());

$(document).ready( function () {
    viewModel.initialize();
    ko.applyBindings(viewModel);
} );