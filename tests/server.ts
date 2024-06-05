import { createObyteHandler } from "../adapter.ts";
import { initTRPC } from "@trpc/server";
import ChatClient from "../src/index.ts";
import { Client } from "obyte";
import { randomBytes } from "crypto";

const t = initTRPC.create();

const obyte_client = new Client('wss://obyte.org/bb-test', {testnet: true});
setInterval(()=>obyte_client.api.heartbeat(), 20000);

const client = new ChatClient({client: obyte_client, config: {wif: "922Rnwdvd4Y88WnHcrGe5KrWwqBvH8Tf4HvENAhXpLe38Akmoqj", name: 'Test', testnet: true, tempPrivKey: randomBytes(32).toString('base64'), prevTempPrivKey: randomBytes(32).toString('base64')}});
export const router = t.router({
  ping: t.procedure.query(()=>{return {ping: 'pong'}}),
  get_signing_key: t.procedure.query(()=>{
    return {pubkey: 'MEowFAYHKoZIzj0CAQYJKyQDAwIIAQEEAzIABG7FrdP/Kqv8MZ4A097cEz0VuG1P\n\ebtdiWNfmIvnMC3quUpg3XQal7okD8HuqcuQCg=='};
  }),
  roll: t.procedure.mutation(({input}: {input: {range: [number, number]}})=>{
    return
  })
});
client.onReady(()=>{
    console.log(client.getPairingLink());
});

createObyteHandler({
    router,
    obyte_client: client,
    createContext: ()=>({})
});