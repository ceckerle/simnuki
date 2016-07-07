var bleno = require('bleno');

var publicKey = "2FE57DA347CD62431528DAAC5FBB290730FFF684AFC4CFC2ED90995F58CB3B74";
var privateKey = "0123452654624657165961";

var KeyturnerInitializationService = require('./keyturner-initialization-service');
var KeyturnerPairingService = require('./keyturner-pairing-service');
var KeyturnerService = require('./keyturner-service');

var keyturnerInitializationService = new KeyturnerInitializationService();
var keyturnerPairingService = new KeyturnerPairingService(publicKey, privateKey);
var keyturnerService = new KeyturnerService();

bleno.on('stateChange', function (state) {
    console.log('on -> stateChange: ' + state);

    if (state === 'poweredOn') {
        bleno.startAdvertising('SimNuki', [keyturnerPairingService.uuid]);
    } else {
        bleno.stopAdvertising();
    }
});

bleno.on('advertisingStart', function (error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

    if (!error) {
        bleno.setServices([
            keyturnerInitializationService,
            keyturnerPairingService,
            keyturnerService
        ]);
    }
});

bleno.on('accept', function (address) {
    console.log('on -> accept: ' + address);
});

bleno.on('disconnect', function () {
    console.log('on -> disconnect');
});

bleno.on('mtuChange', function (mtu) {
    console.log('on -> mtuChange: ' + mtu);
});

bleno.on('servicesSet', function (error) {
    console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});

bleno.on('readRequest', function (offset) {
    console.log('on -> readRequest at offset ' + offset);
});

bleno.on('writeRequest', function (offset) {
    console.log('on -> writeRequest at offset ' + offset);
});

bleno.on('notify', function () {
    console.log('on -> notify');
});

bleno.on('indicate', function () {
    console.log('on -> indicate');
});

bleno.on('subscribe', function (offset) {
    console.log('on -> subscribe');
});

bleno.on('unsubscribe', function (offset) {
    console.log('on -> unsubscribe');
});

