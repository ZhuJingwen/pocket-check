// (c) 2014 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, resultDiv, messageInput, sendButton, disconnectButton */
/* global ble  */
/* jshint browser: true , devel: true*/
'use strict';
// ASCII only

var deviceIdToSend;

function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// ASCII only
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

function sendMsg(message) {
    console.log("start send");
    var success = function() {
    };

    var failure = function(err) {
        console.log("Failed writing data to the bluefruit le");
        console.log(err);

    };

    var data = stringToBytes(message);

    if (app.writeWithoutResponse) {
        ble.writeWithoutResponse(
            deviceIdToSend,
            bluefruit.serviceUUID,
            bluefruit.txCharacteristic,
            data, success, failure
        );
    } else {
        ble.write(
            deviceIdToSend,
            bluefruit.serviceUUID,
            bluefruit.txCharacteristic,
            data, success, failure
        );
    }
}

// this is Nordic's UART service
var bluefruit = {
    serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
    rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e' // receive is from the phone's perspective
};


var identifiers = {
    green: '792aca5aef8e97b8',
    purple: 'd1ebb1b1d5b877a5',
    blue: '71a8aeb13c06db7c',
    yellow: 'c8e4ff0b9fe72cf7'
        //    pink: '448856f9d2624680',
};

var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchend', this.refreshDeviceList, false);
        rangeButton.addEventListener('touchend', this.startRangingNearables, false);
        disconnectButton.addEventListener('touchend', this.disconnect, false);
        deviceList.addEventListener('touchend', this.connect, false); // assume not scrolling
    },
    onDeviceReady: function() {
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empties the list
        if (cordova.platformId === 'android') { // Android filtering is broken
            ble.scan([bluefruit.serviceUUID], 5, app.onDiscoverDevice, app.onError);
        } else {
            ble.scan([bluefruit.serviceUUID], 5, app.onDiscoverDevice, app.onError);
        }
    },
    onDiscoverDevice: function(device) {
        var listItem = document.getElementById('deviceList'),
            html = "Jacket";

        listItem.dataset.deviceId = device.id;
        listItem.innerHTML = html;
        deviceList.appendChild(listItem);
    },

    connect: function(e) {
        var deviceId = e.target.dataset.deviceId,
            onConnect = function(peripheral) {
                app.determineWriteType(peripheral);

                // subscribe for incoming data
                ble.startNotification(deviceId, bluefruit.serviceUUID, bluefruit.rxCharacteristic, app.onData, app.onError);
                //sendButton.dataset.deviceId = deviceId;
                disconnectButton.dataset.deviceId = deviceId;
                // app.showDetailPage();
            };
        deviceIdToSend = deviceId;
        ble.connect(deviceId, onConnect, app.onError);
    },
    determineWriteType: function(peripheral) {
        // Adafruit nRF8001 breakout uses WriteWithoutResponse for the TX characteristic
        // Newer Bluefruit devices use Write Request for the TX characteristic

        var characteristic = peripheral.characteristics.filter(function(element) {
            if (element.characteristic.toLowerCase() === bluefruit.txCharacteristic) {
                return element;
            }
        })[0];

        if (characteristic.properties.indexOf('WriteWithoutResponse') > -1) {
            app.writeWithoutResponse = true;
        } else {
            app.writeWithoutResponse = false;
        }

    },
    onData: function(data) { // data received from Arduino
        //console.log(data);
        // resultDiv.innerHTML = resultDiv.innerHTML + "Received: " + bytesToString(data) + "<br/>";
        // resultDiv.scrollTop = resultDiv.scrollHeight;
         var inString = bytesToString(data);
         //console.log("string " + inString);
         var inChar = inString.charAt(0);
        if(inChar == 'C'){
            console.log("start range scan");
            app.startRangingNearables();
        }
    },
    disconnect: function(event) {
        var deviceId = event.target.dataset.deviceId;
        ble.disconnect(deviceId, app.jacketOff, app.onError);
    },
    onError: function(reason) {
        console.log("ERROR: " + reason); // real apps should use notification.alert
    },

    startRangingNearables: function() {

        var onRange = function(nearable) {
            var status;
            if (nearable.rssi > -90) {
                console.log(nearable.nameForType + " on"+","+nearable.rssi);
                status = true;
                setNeopixels(nearable.nameForType, status);
            } else {
                console.log(nearable.nameForType + " off"+","+nearable.rssi);
                status = false;
                setNeopixels(nearable.nameForType, status);
            }
            //displayNearablesInfo(nearable);
            estimote.nearables.stopRangingForIdentifier(
                nearable.identifier,
                function() {
                    console.log("stopped");
                },
                onError
            );

        };

        var setNeopixels = function(name, status) {
            if (name == "bag") {
                // neopixels.wallet = status;
                if (status == true) {
                    sendMsg("a");

                } else {
                    sendMsg("b");

                }
            } else if (name == "bike") {
                // neopixels.key = status;
                if (status == true) {
                    sendMsg("c");

                } else {
                    sendMsg("d");

                }

            } else if (name == "dog") {
                // neopixels.umbrella = status;
                if (status == true) {
                    sendMsg("e");

                } else {
                    sendMsg("f");

                }

            } else if (name == "generic") {
                // neopixels.item == status;
                if (status == true) {
                    sendMsg("g");

                } else {
                    sendMsg("h");

                }

            }
        }


        var onError = function(errorMessage) {
            console.log('Range error: ' + errorMessage);
        };

        var displayNearablesInfo = function(nearables) {
            // console.log("start display");
            // console.log(nearables);
            // // Clear HTML list.
            // $('#id-screen-range-nearables .style-item-list').empty();

            // // Generate HTML for nearables.
            // $.each(nearables, function(i, nearable) {
            //     var element = $(createNearableHTML(nearable));
            //     $('#id-screen-range-nearables .style-item-list').append(element);
            // });
        };

        var createNearableHTML = function(nearable) {
            // console.log("create html");
            // var colorClasses = 'style-color-blueberry-dark style-color-blueberry-dark-text';
            // var htm = '<div class="' + colorClasses + '">' + '<table><tr><td>Type</td><td>' + nearable.nameForType + '</td></tr><tr><td>Identifier</td><td>' + nearable.identifier + '</td><tr><td>Color</td><td>' + nearable.nameForColor + '</td></tr><tr><td>Zone</td><td>' + nearable.zone + '</td></tr><tr><td>RSSI</td><td>' + nearable.rssi + '</td></tr><tr><td>Temperature</td><td>' + nearable.temperature + '</td></tr><tr><td>Is moving</td><td>' + (nearable.isMoving ? 'Yes' : 'No') + '</td></tr><tr><td>xAcceleration</td><td>' + nearable.xAcceleration + '</td></tr><tr><td>yAcceleration</td><td>' + nearable.yAcceleration + '</td></tr><tr><td>zAcceleration</td><td>' + nearable.zAcceleration + '</td></tr></table></div>';
            // return htm;
        };

        $.each(identifiers, function(i, id) {
            estimote.nearables.startRangingForIdentifier(
                id,
                onRange,
                onError
            );


        });

    },

    //UI changes

    jacketOn: function() {

    },

    jacketOff: function() {
        //UI Jacket Off
    },

    walletOn: function() {

    },

    walletOff: function() {
        //UI Jacket Off
    },

    keyOn: function() {

    },

    keyOff: function() {
        //UI Jacket Off
    },
    objectOn: function() {

    },

    objectOff: function() {
        //UI Jacket Off
    }

};