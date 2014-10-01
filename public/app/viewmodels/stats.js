'use strict';
define(function (require) {
    var _ = require('lodash');
    var dataTables = require('datatables'); // used implicitly, do not remove
    var FilterData = require('filterdata');
    var table;

    var classDatas = [
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

    var rarityDatas = [
        new FilterData('allrarities', 'All', true),
        new FilterData('common', 'Common', false),
        new FilterData('rare', 'Rare', false),
        new FilterData('epic', 'Epic', false),
        new FilterData('legendary', 'Lengendary', false)
    ];

    var setDatas = [
        new FilterData('allsets', 'All', true),
        new FilterData('naxxramas', 'Naxxramas', false)
    ];

    var filterButtonClick = function(filterData) {
        // process clicks from class filter buttons
        // make sure only one is on at a time
        var clickedClassData = _.find(classDatas, function(classData) {
            return classData.name === filterData.name;
        });

        var clickedRarityData = _.find(rarityDatas, function(rarityData) {
            return rarityData.name === filterData.name;
        });

        var clickedSetData = _.find(setDatas, function(setData) {
            return setData.name === filterData.name;
        });

        if (clickedClassData) {
            _.forEach(classDatas, function(classData) {
                classData.isActive(false);
            });

            clickedClassData.isActive(!clickedClassData.isActive());
            updateClass(clickedClassData);
        }

        if (clickedRarityData) {
            _.forEach(rarityDatas, function(rarityData) {
                rarityData.isActive(false);
            });

            clickedSetData = _.find(setDatas, function(setData) {
                return setData.isActive();
            });

            clickedRarityData.isActive(!clickedRarityData.isActive());
            cardSearch(clickedRarityData, clickedSetData);
        }

        if (clickedSetData) {
            _.forEach(setDatas, function(setData) {
                setData.isActive(false);
            });

            clickedRarityData = _.find(rarityDatas, function(rarityData) {
                return rarityData.isActive();
            });

            clickedSetData.isActive(true);
            cardSearch(clickedRarityData, clickedSetData);
        }
    };

    var updateClass = function(classData) {
        return $.post('/api/getcards/', { class: classData.name }, function(data) {
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
                        { render: function(cellData, type, rowData, meta) {
                            return (rowData.totalMatchups ? (rowData.totalWins / rowData.totalMatchups * 100).toFixed(2) : 0) + '%';
                        }, title: 'Win Ratio' },
                        { data: 'rank', title: 'Rank' }
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
        compositionComplete: function() {
            var activeClassData = _.find(classDatas, function(classData) {
                return classData.isActive();
            });
            return updateClass(activeClassData);
        },
        classes: classDatas,
        rarities: rarityDatas,
        sets: setDatas,
        filterButtonClick: filterButtonClick
    };
});