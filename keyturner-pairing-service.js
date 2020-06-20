var util = require('util');
var bleno = require('@abandonware/bleno');
var pc = require("./PairingCharacteristic")

var BlenoPrimaryService = bleno.PrimaryService;

function KeyturnerPairingService(keys, config) {
    KeyturnerPairingService.super_.call(this, {
        // uuid: 'a92ee100-5501-11e4-916c-0800200c9a66',
        uuid: 'a92ee100550111e4916c0800200c9a66',
        characteristics: [
            new pc.PairingCharacteristic(keys, config)
        ]
    });
}

util.inherits(KeyturnerPairingService, BlenoPrimaryService);

module.exports = KeyturnerPairingService;
