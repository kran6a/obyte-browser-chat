import Client from "./_texto/client";
import { generatePaymentMessage } from './_texto/utils';
import { randomBytes } from 'crypto';
import {Message} from './_texto/client';

type ClientConfig = {
  testnet: boolean,
  wif: string,
  tempPrivKey: string, //b64
  prevTempPrivKey: string, //b64
  name: string
}

class ChatClient {
  private invite: string;
  private ready: boolean;
  private messages;
  private pairingCallback;
  private messageCallback;
  private readyCallback;
  private client: any;
  private textoInstants: Client;


  constructor({client, config}: {client: any, config: ClientConfig}) {
    this.messages = [];
    this.ready = false;
    this.client = client;

    this.client.requestAsync = (command: string, params: any)=>new Promise((resolve, reject)=>this.client.client.request(command, params, (e: Error, result)=>e ? reject(e) : resolve(result)));

    this.textoInstants = new Client({...config, client});

    this.invite = `obyte${config.testnet ? "-tn" : ""}:${this.textoInstants.devicePubKey}@obyte.org/bb${config.testnet ? "-test" : ""}`

    this.textoInstants.on('ready', () => {
      this.ready = true;
      this.readyCallback && this.readyCallback(this.invite);
    });

    this.textoInstants.on('pairing', (msg) => {
      this.pairingCallback && this.pairingCallback(msg);

      const req = this.messages.find((m) => m.requestId === msg.body.pairing_secret);

      if (req) msg.reply(req.message);
    });

    this.textoInstants.on('message', (msg) => {
      console.log("Got message", msg);
      this.messageCallback && this.messageCallback(msg);
    });

    this.client.onConnect(() => this.messages = []);

    setTimeout(() => {
      if (!this.ready) {
        this.client.justsaying("hub/repeat_challenge");
      }
    }, 500);

  }

  /**
   * Callback function is triggered when the device connects to the hub
   * @memberOf obyte-browser-chat
   * @callback
   * @example
   * const chatInstance.onReady(() => console.log("I'm connected to the hub")));
   */
  onReady(cb: ()=>void) {
    this.readyCallback = cb;
  }

  /**
   * Send message when pairing
   * @memberOf obyte-browser-chat
   * @param {string} message
   * @return {string} pairing link with requestId
   * @example
   * const link = chatInstance.sendMessageAfterPairing(message);
   */
  sendMessageAfterPairing(message: string) {
    const requestId = randomBytes(32).toString('base64');
    this.messages.push({ requestId, message })
    return `${this.invite}#${requestId}`;
  }

  /**
   * Get pairing link
   * @memberOf obyte-browser-chat
   * @return {string} pairing link
   * @example
   * const link = chatInstance.getPairingLink();
   */
  getPairingLink() {
    return `${this.invite}#0000`;
  }

  /**
 * Message
 * @callback MessageCallback
 * @param message {{reply: function, body: string | object, sender: string}}
 */

  /**
   * Message
   * @memberOf obyte-browser-chat
   * @param {MessageCallback} cb - The callback that handles the message.
   * @example
   * const chatInstance.onPairing((msg) => msg.reply('pairing'));
   */
  onPairing(cb) {
    this.pairingCallback = cb;
  }

  /**
 * Message
 * @memberOf obyte-browser-chat
 * @param {MessageCallback} cb - The callback that handles the message.
 * @example
 * const chatInstance.onMessage((msg) => msg.reply('ok'));
 */
  onMessage(cb: (msg: Message)=>void) {
    this.messageCallback = cb;
  }

  /**
  * Function that converts the payment object to base64
  * @memberOf obyte-browser-chat
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

export default ChatClient;