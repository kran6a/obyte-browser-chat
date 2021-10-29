# obyte browser chat

*This library uses local storage*
## Install
``yarn add obyte-browser-chat obyte``

## Use
``import browserChat from "obyte-browser-chat"``
 
## Example

### 1. Create instance obyte.js client
```js 
import obyte from "obyte";

export default new obyte.Client('wss://obyte.org/bb-testnet'); // or wss://obyte.org/bb for livenet
```

### 2. Create instance chat
```js 
import browserChat from "obyte-browser-chat";

import client from "..."; // obyte.js client instance

export default browserChat({
  name: "This is my chat", // chat name
  client, // obyte.js client instance
  testnet: true
});
```


### 3. Use
```js 
import browserChatInstance from "..."; 

const payments = [
  {
    address: "2QVJOY3BRRGWP7IOYL64O5BU3WLUJ4TZ",
    amount: 1e9, // integer, amount in smallest units
    asset: "base"
  },
  {
    address: "EJC4A7WQGHEZEKW6RLO7F26SAR4LAQBU",
    amount: 2e9,
    asset: "base"
  }
];

const paymentJsonBase64 = browserChatInstance.generatePaymentString({ payments });

const message = `Send bytes \n[send](payment:${paymentJsonBase64})`;

const link = browserChatInstance.sendMessageAfterPairing(message);

...

<a href={link}>Click</a>
```

## Methods

### getPairingLink - Returns a link for pairing

```js
const pairingLink = browserChatInstance.getPairingLink();
```

### sendMessageAfterPairing - Returns a link for pairing

```js
const pairingLink = browserChatInstance.sendMessageAfterPairing("We're glad to see you");
```

### onPairing - Callback function triggered when pairing devices

```js
const link = browserChatInstance.onPairing((invite) => {
  console.log("invite", invite)
});
```

### onMessage - Callback function triggered when a message is received

```js
browserChatInstance.onMessage((msgObject) => {
  msgObject.reply("Ok");
});
```

### onReady - Callback function is triggered when the device connects to the hub

```js
browserChatInstance.onReady(() => {
  console.log("I'm connected to the hub");
});
```

### generatePaymentString - Function that converts the payment object to base64

```js
const payments = [
  {
    address: "2QVJOY3BRRGWP7IOYL64O5BU3WLUJ4TZ",
    amount: 1e9,
    asset: "base"
  },
  {
    address: "EJC4A7WQGHEZEKW6RLO7F26SAR4LAQBU",
    amount: 2e9,
    asset: "base"
  }
];

const paymentJsonBase64 = chatInstance.generatePaymentString({ payments });
```