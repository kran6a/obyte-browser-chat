# obyte browser chat

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
    amount: Math.trunc(1e9),
    asset: "base"
  },
  {
    address: "EJC4A7WQGHEZEKW6RLO7F26SAR4LAQBU",
    amount: Math.trunc(2e9),
    asset: "base"
  }
];

const paymentJsonBase64 = browserChatInstance.generatePaymentString({ payments });

const message = `Send bytes \n[send](payment:${paymentJsonBase64})`;

const link = browserChatInstance.getLink(message);

...

<a href={link}>Click</a>
```