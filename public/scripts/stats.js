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
        new FilterData('warrior', 'Garrosh', false),
    ];

    var _rarityDatas = [
        new FilterData('allrarities', 'All', true),
        new FilterData('common', 'Common', false),
        new FilterData('rare', 'Rare', false),
        new FilterData('epic', 'Epic', false),
        new FilterData('legendary', 'Lengendary', false)
    ];

    var _setDatas = [
        new FilterData('allsets', 'All', true),
        new FilterData('naxxramas', 'Naxxramas', false),
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

        var clickedSetData = _.find(_setDatas, function(setData) {
            return setData.name === filterData.name;
        });

        if (clickedClassData) {
            _.forEach(_classDatas, function(classData) {
                classData.isActive(false);
            });

            clickedClassData.isActive(!clickedClassData.isActive());
        }

        if (clickedRarityData) {
            _.forEach(_rarityDatas, function(rarityData) {
                rarityData.isActive(false);
            });

            clickedSetData = _.find(_setDatas, function(setData) {
                return setData.isActive();
            });

            clickedRarityData.isActive(!clickedRarityData.isActive());
            cardSearch(clickedRarityData, clickedSetData);
        }

        if (clickedSetData) {
            _.forEach(_setDatas, function(setData) {
                setData.isActive(false);
            });

            clickedRarityData = _.find(_rarityDatas, function(rarityData) {
                return rarityData.isActive();
            });

            clickedSetData.isActive(true);
            cardSearch(clickedRarityData, clickedSetData);
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
                    order:  [ 6, 'desc' ],
                    columns: [
                        { render: function(cellData, type, rowData, meta) {
                            return '<span class="card-preview text-highlight">' + rowData.name + '<span><img src="' + rowData.url + '"></span></span>';
                        }, title: 'Name', width: '30%' },
                        { data: 'mana', title: 'Mana' },
                        { data: 'rarity', title: 'Rarity', className: 'column-rarity', visible: verbose },
                        { data: 'set', title: 'Set', className: 'column-set', visible: verbose },
                        { data: 'totalMatchups', title: 'Total Matchups', visible: verbose },
                        { data: 'totalWins', title: 'Total Wins', visible: verbose },
                        { data: 'rank', title: 'Rank' },
                        { render: function(cellData, type, rowData, meta) {
                            return (rowData.totalMatchups ? (rowData.totalWins / rowData.totalMatchups * 100).toFixed(2) : 0) + '%';
                        }, title: 'Win Ratio' }
                    ]
                });
            }
        });
    };

    var cardSearch = function(rarityData, setData) {
        var raritySearch = rarityData.name === 'allrarities' ? '' : rarityData.name;
        var setSearch = setData.name === 'allsets' ? '' : setData.name;
        table.columns('.column-rarity')
            .search(raritySearch)
            .columns('.column-set')
            .search(setSearch)
            .draw();
    };

    return {
        initialize: initialize,
        classes: _classDatas,
        rarities: _rarityDatas,
        sets: _setDatas,
        filterButtonClick: filterButtonClick
    };
}());

$(document).ready( function () {
    viewModel.initialize();
    ko.applyBindings(viewModel);
});