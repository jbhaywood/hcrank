'use strict';
define(function (require) {
    var Modernizr = require('modernizr');
    var ko = require('knockout');

    return function FilterData(name, displayName, activeDefault, url) {
        this.name = name;
        this.displayName = displayName;
        this.url = url || '';
        this.isActive = ko.observable(activeDefault);
        this.storageKey = name + '_active';
        this.loadSettings = function() {
            if (Modernizr.localstorage) {
                var isActive = localStorage[this.storageKey];
                if (isActive === undefined) {
                    isActive = activeDefault;
                    localStorage[this.storageKey] = isActive;
                } else {
                    isActive = isActive === 'true';
                }
                this.isActive(isActive);
            }
        };
        this.setActive = function(isActive) {
            this.isActive(isActive);
            if (Modernizr.localstorage) {
                localStorage[this.storageKey] = isActive;
            }
        };
        this.isNeutralOrCommon = function() {
            return this.name === 'neutral' || this.name === 'common';
        };
    };
});
