import { createTRPCClient } from "@trpc/client";
import { rmqLink } from "../link.ts";
import { router } from "./server.ts";
import { Client } from "obyte";

const obyte_client = new Client('wss://obyte.org/bb-test', {testnet: true});

setInterval(()=>obyte_client.api.heartbeat(), 20000);

const client = createTRPCClient<typeof router>({
    links: [
        rmqLink({
            server_pubkey: "ApI/CO2WC2e/3ALxNnGNW0anRJTrOCYzNBcY2EKq7n8o",
            obyte_client: obyte_client,
            testnet: true,
            wif: "92dE8hLVeaRk1AmpVtTwNxofUR4y8KXFw3TVSEU8KoWLqnkSKVC"
        })
    ]
});

client.ping.query()
.then((x)=>console.log("IT WORKS!", x))
.catch(x=>console.error(x));