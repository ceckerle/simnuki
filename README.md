# simnuki
Simulates a Nuki.io Smart Lock (runs on Raspberry PI on node.js - needs bluetooth dongle on Raspberry PI < 3)
The official nuki app can pair with it and some actions can be performed like lock, unlock.

Note that this code is preliminary and my cause unexpected results.

# Installation
Tested on a Raspberry PI 4 running Raspberry Pi OS 2020-05-27 and Node.js 12.8.1.

## Install Node.js
https://nodejs.org/en/download/package-manager/

## Bluetooth connection
```sh
sudo apt-get install libbluetooth-dev libudev-dev
```

### Running without root/sudo

Run the following command:

```sh
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

This grants the ```node``` binary ```cap_net_raw``` privileges, so it can start/stop BLE advertising.

__Note:__ The above command requires ```setcap``` to be installed, it can be installed using the following:

 * apt: ```sudo apt-get install libcap2-bin```

(see https://github.com/abandonware/bleno#running-on-linux)

## Get node modules
In the cloned repository run:
```sh
npm install
```

## Compile TypeScript
```sh
npm run build
```

## Run it
To run the simulator, call node with main.js. It advertises a nuki smart lock via Bluetooth and the Nuki app (tried with iOS) can pair and do lock and unlock operations. Note, that not all of the Nuki API is implemented. For example, adding additional users is not there currently.

There is also the counterpart for it: a library to build a client: https://github.com/as19git67/nukible. In the samples directory there is main.js, which can be used on a second Raspberry PI to simulate the Nuki app.

```sh
npm start
```
