/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let preferences = require('sdk/preferences/service');
let persistToggleState = require('sdk/simple-prefs').prefs['persistToggleState'];
let { PrefsTarget } = require('sdk/preferences/event-target');

// Load the ActionButton module, if possible.
let ActionButton = false;
try {
    ActionButton = require('sdk/ui/button/action').ActionButton;
} catch(e) {}

let iconSizes = [16, 32, 48, 64];

function createIconSizesHash(name) {
    let hash = {};
    iconSizes.forEach(function(size) {
        hash[size] = './' + name + '-' + size + '.png';
    });
    return hash;
}

function SettingsAddon(params) {
    this.icons = params.icons;
    this.key = params.key;
    this.labels = params.labels;
    this.value = params.value;

    if (ActionButton) {
        this.button = this.createButton();
    }

    this.enabled = false;
    this.target = PrefsTarget({ branchName: this.key });

    this.listen();
    this.softEnable();
}

SettingsAddon.prototype.createButton = function() {
    return ActionButton({
        icon: this.icons.enabled,
        id: 'toggle',
        label: this.labels.enabled,
        onClick: this.onClick.bind(this),
    });
};

SettingsAddon.prototype.disable = function() {
    this.enabled = false;
    preferences.reset(this.key);
};

SettingsAddon.prototype.softEnable = function() {
    if (persistToggleState) {
        this.onChange();
    } else {
        this.enabled = true;
        preferences.set(this.key, this.value);
    }
};

SettingsAddon.prototype.enable = function() {
    this.enabled = true;
    preferences.set(this.key, this.value);
};

SettingsAddon.prototype.listen = function() {
    this.target.on('', this.onChange.bind(this));
};

SettingsAddon.prototype.onChange = function() {
    this.enabled = (preferences.get(this.key) === this.value);
    this.render();
};

SettingsAddon.prototype.onClick = function() {
    if (this.enabled) {
        this.disable();
    } else {
        this.enable();
    }
};

SettingsAddon.prototype.render = function() {
    if (!ActionButton) {
        return;
    }

    if (this.enabled) {
        this.button.label = this.labels.enabled;
        this.button.icon = this.icons.enabled;
    } else {
        this.button.label = this.labels.disabled;
        this.button.icon = this.icons.disabled;
    }
};



// Default to disabling IndexedDB.
let key = 'dom.indexedDB.enabled';
let value = false;

let addon = new SettingsAddon({
    key: key,
    icons: {
        disabled: createIconSizesHash('unsafe'),
        enabled: createIconSizesHash('safe'),
    },
    labels: {
        disabled: 'IndexedDB is not disabled. Be careful.',
        enabled: 'IndexedDB is disabled.',
    },
    value: value,
});

exports.main = addon.enable.bind(addon);
exports.onUnload = addon.disable.bind(addon);
