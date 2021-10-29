# Obyte browser chat

A library for establishing chat sessions between your web-based dapp and the user's [Obyte](https://obyte.org) wallet. Use the chat to:

* request payments, including payments in multiple assets;
* request to sign a message;
* request user's address (without having to copy/paste);
* request private profiles (such as real name attestations);
* request a vote in a poll.

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

  // send a plain text message
  msgObject.reply("Hi there!");

  // request to sign a text message
  msgObject.reply("Please prove ownership of your address by signing this message: [any text](sign-message-request:I confirm for domain.com that I own the address SPV5WIBQQT4DMW7UU5GWCMLYDVNGKECD)");

  // request to sign an object
  const order = {field1: "value1"};
  const orderJsonBase64 = Buffer.from(JSON.stringify(order), 'utf8').toString('base64');
  msgObject.reply(`Please sign an order: [any text](sign-message-request:${orderJsonBase64})`);

  // request a private profile
  msgObject.reply(`Click this link to reveal your private profile to us: [any text](profile-request:first_name,last_name,dob,country,id_type).`);

  // request a vote
  const objVote = {
    poll_unit: '0Vv6lhpjjk3VsKCSGML2NY/5W+WgpsNELQJ1rukhL5Y=',
    choice: 'Institute For the Future of the University of Nicosia',
  };
  const voteJsonBase64 = Buffer.from(JSON.stringify(objVote), 'utf8').toString('base64');
  msgObject.reply(`Click to vote for ${objVote.choice}: [any text](vote:${voteJsonBase64}).`);

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