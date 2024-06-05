import Client from "./_texto/client";
import { generatePaymentMessage, sign } from './_texto/utils';
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
  private ready: boolean = false;
  private messages: {requestId: string, message: string}[] = [];
  private pairingCallback: (msg: Message)=>void = ()=>{};
  private messageCallback: (msg: Message)=>void = ()=>{};
  private readyCallback: (invite: string)=>void = ()=>{};
  private client: any;
  private textoInstants: Client;


  constructor({client, config}: {client: any, config: ClientConfig}) {
    this.client = client;

    this.client.requestAsync = (command: string, params: any)=>new Promise((resolve, reject)=>this.client.client.request(command, params, (e: Error, result: any)=>e ? reject(e) : resolve(result)));

    this.textoInstants = new Client({...config, client});

    this.invite = `obyte${config.testnet ? "-tn" : ""}:${this.textoInstants.devicePubKey}@obyte.org/bb${config.testnet ? "-test" : ""}`

    this.textoInstants.on('ready', () => {
      this.ready = true;
      this.readyCallback && this.readyCallback(this.invite);
    });

    this.textoInstants.on('pairing', (msg) => {
      this.pairingCallback && this.pairingCallback(msg);

      const req = this.messages.find((m) => m.requestId === (msg.body as any).pairing_secret);

      if (req){
        msg.reply(req.message);
      }
    });

    this.textoInstants.on('message', (msg) => {
      this.messageCallback && this.messageCallback(msg);
    });

    this.client.onConnect(() => this.messages = []);

    setTimeout(() => {
      if (!this.ready) {
        this.client.justsaying("hub/repeat_challenge");
      }
    }, 500);

  }

  onReady(cb: (invite: string)=>void) {
    this.readyCallback = cb;
  }

  sendMessageAfterPairing(message: string) {
    const requestId = randomBytes(32).toString('base64');
    this.messages.push({ requestId, message })
    return `${this.invite}#${requestId}`;
  }

  getPairingLink() {
    return `${this.invite}#0000`;
  }

  onPairing(cb: (msg: Message)=>void) {
    this.pairingCallback = cb;
  }

  onMessage(cb: (msg: Message)=>void) {
    this.messageCallback = cb;
  }

  generatePaymentString(payments: {address: string, amount: number, asset: string}[]) {
    return generatePaymentMessage(payments)
  }

  public sign_message(message: object){
    return signed()
  }

  send(receiver_pubkey: string, subject: string, msg: string){
    return this.textoInstants.send(receiver_pubkey, subject, msg);
  }
}

export default ChatClient;