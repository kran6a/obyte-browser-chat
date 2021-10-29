import Client from "./_texto/client";
import { toWif, generatePaymentMessage } from './_texto/utils';
import { randomBytes } from 'crypto';

export default class {
  #invite;
  #messages;
  #pairingCallback;
  #messageCallback;
  #readyCallback;
  #LOCALSTORAGE_KEY;

  /**
   * Creates a new chat instance.
   * @memberOf obyte-multi-payments
   * @class
   * @param {object} client - obyte.js instance
   * @param {string} [name=Chat] - Chat name
   * @param {boolean} [testnet=false] - true for test network
   */
  constructor(client, name = "Chat", testnet = false) {
    this.#LOCALSTORAGE_KEY = `chat-${testnet ? "testnet" : "livenet"}`;
    this.#messages = [];
    this.#invite = null;
    this.client = client;
    this.name = name;
    this.testnet = testnet;

    if (!client) {
      console.error("Client is undefined");
      return null;
    }

    let clientConfig;
    const lSClientConfig = localStorage.getItem(`${this.#LOCALSTORAGE_KEY}.texto`);

    if (lSClientConfig) {
      clientConfig = JSON.parse(lSClientConfig);
    } else {
      clientConfig = {
        testnet: this.testnet,
        wif: toWif(randomBytes(32), this.testnet),
        tempPrivKey: randomBytes(32).toString('base64'),
        prevTempPrivKey: randomBytes(32).toString('base64'),
        name: this.name
      };
      localStorage.setItem(`${this.#LOCALSTORAGE_KEY}.texto`, JSON.stringify(clientConfig));
    }

    this.client.requestAsync = (command, params) =>
      new Promise((resolve, reject) => {
        this.client.client.request(command, params, (e, result) => {
          if (e) return reject(e);
          resolve(result);
        });
      });

    clientConfig.client = client;

    this.textoInstants = new Client(clientConfig);

    this.textoInstants.on('ready', () => {
      const devicePubKey = this.textoInstants.devicePubKey;
      const invite = `obyte${this.testnet ? "-tn" : ""}:${devicePubKey}@obyte.org/bb${this.testnet ? "-test" : ""}`;
      this.#invite = invite;
      this.#readyCallback && this.#readyCallback(invite);
    });

    this.textoInstants.on('pairing', msg => {
      this.#pairingCallback && this.#pairingCallback(msg);

      const req = this.#messages.find((m) => m.requestId === msg.body.pairing_secret);

      if (req) msg.reply(req.message);
    });

    this.textoInstants.on('message', msg => {
      this.#messageCallback && this.#messageCallback(msg);
    })

    this.client.onConnect(() => {
      this.#messages = [];
    })
  }

  /**
   * Message
   * @memberOf obyte-multi-payments
   * @callback
   * @example
   * const chatInstance.onReady((invite) => console.log("invite")));
   */
  onReady(cb) {
    this.#readyCallback = cb;
  }

  /**
   * Send message when pairing
   * @memberOf obyte-multi-payments
   * @param {string} message
   * @return {string} pairing link with requestId
   * @example
   * const link = chatInstance.sendMessageWhenPairing(message);
   */
  sendMessageWhenPairing(message) {
    const requestId = randomBytes(32).toString('base64');
    this.#messages.push({ requestId, message })
    return `${this.#invite}#${requestId}`;
  }

  /**
   * Get pairing link
   * @memberOf obyte-multi-payments
   * @return {string} pairing link
   * @example
   * const link = chatInstance.getPairingLink();
   */
  getPairingLink() {
    return this.#invite;
  }

  /**
 * Message
 * @callback MessageCallback
 * @param message {{reply: function, body: string | object, sender: string}}
 */

  /**
   * Message
   * @memberOf obyte-multi-payments
   * @param {MessageCallback} cb - The callback that handles the message.
   * @example
   * const chatInstance.onPairing((msg) => msg.reply('pairing'));
   */
  onPairing(cb) {
    this.#pairingCallback = cb;
  }

  /**
 * Message
 * @memberOf obyte-multi-payments
 * @param {MessageCallback} cb - The callback that handles the message.
 * @example
 * const chatInstance.onMessage((msg) => msg.reply('ok'));
 */
  onMessage(cb) {
    this.#messageCallback = cb;
  }

  /**
  * Function that converts the payment object to base64
  * @memberOf obyte-multi-payments
  * @param {Object} payments
  * @param {Array} payments.payments
  * @example
  * const payments = [
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
  */
  generatePaymentString(payments) {
    return generatePaymentMessage(payments)
  }
}