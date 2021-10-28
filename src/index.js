import Client from "./_texto/client";
import { toWif, generatePaymentMessage } from './_texto/utils';
import { randomBytes } from 'crypto';

export default class {
  constructor(client, name = "Chat", testnet = false) {
    this.LOCALSTORAGE_KEY = `chat-${testnet ? "testnet" : "livenet"}`;
    this.messages = [];
    this.invite = null;
    this.client = client;
    this.name = name;
    this.testnet = testnet;
    this.ready = false;

    if (!client) {
      console.error("Client is undefined");
      return null;
    }

    let clientConfig;
    const lSClientConfig = localStorage.getItem(`${this.LOCALSTORAGE_KEY}.texto`);

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
      localStorage.setItem(`${this.LOCALSTORAGE_KEY}.texto`, JSON.stringify(clientConfig));
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
      this.ready = true;
      this.invite = invite;
      this.onReadyCallback && this.onReadyCallback(invite);
    });

    this.textoInstants.on('pairing', msg => {
      const req = this.messages.find((m) => m.requestId === msg.body.pairing_secret);
      if (req) msg.reply(req.message);
    });

    this.client.onConnect(() => {
      this.messages = [];
    })
  }

  onReady(cb){
    this.onReadyCallback = cb;
  }

  getLink(msg) {
    const requestId = randomBytes(32).toString('base64');
    this.messages.push({ requestId, message: msg })
    return `${this.invite}#${requestId}`;
  }

  generatePaymentString(...data) {
    return generatePaymentMessage(...data)
  }
}