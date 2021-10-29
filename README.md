# Obyte browser chat

*This library uses local storage*
## Install
``yarn add obyte-browser-chat obyte``

## Use
```js
import browserChat from "obyte-browser-chat"
```
 
## Example

### 1. Create an instance of obyte.js client
```js 
import obyte from "obyte";

export default new obyte.Client('wss://obyte.org/bb-test'); // or wss://obyte.org/bb for livenet
```

### 2. Create an instance of chat
```js 
import browserChat from "obyte-browser-chat";

import client from "..."; // obyte.js client instance

export default browserChat({
  name: "mydomain.com", // chat name that'll show up in the user's wallet
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
Returns a link that looks like `obyte:PUB_KEY@obyte.org/bb`. The user needs to click it to open the chat.

### sendMessageAfterPairing - Returns a link for pairing

```js
const pairingLink = browserChatInstance.sendMessageAfterPairing("We're glad to see you");
```
As above, plus the provided message will be sent to the user immediately after pairing.

### onPairing - Callback function triggered after pairing
```js
browserChatInstance.onPairing((msgObject) => {
  console.log("msgObject", msgObject);
  msgObject.reply("Hi there!");
});
```
where `msgObject` contains:
* `reply` - message forwarding function 
* `body` - object with `pairing_secret` field
* `sender` - sender's public key

### onMessage - Callback function triggered when a message is received

```js
browserChatInstance.onMessage((msgObject) => {
  msgObject.reply("Thanks, you said: " + msgObject.body);
});
```
where `msgObject` contains:
* `reply` - message forwarding function 
* `body` - received message (string)
* `sender` - sender's public key

### onReady - Callback function triggered when the device gets connected to the hub

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