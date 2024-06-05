import { randomBytes } from "crypto";
import browserChat from "./src/index";
import obyte from "obyte"; // obyte.js client instance
import { readFileSync } from "fs";

const client = new obyte.Client('wss://obyte.org/bb-test');
setInterval(client.api.heartbeat, 30000);
const config = JSON.parse(readFileSync("./config.json").toString("utf-8"));

const chat = new browserChat({client,
    config: {
        ...config,
        tempPrivKey: randomBytes(32).toString('base64'),
        prevTempPrivKey: randomBytes(32).toString('base64'),
    }
  });
  chat.onReady(()=>{
    console.log(chat.getPairingLink())
  })
  chat.onMessage((msg)=>{
    msg.reply("Hello " + msg.body);
  })
console.log(chat.getPairingLink())