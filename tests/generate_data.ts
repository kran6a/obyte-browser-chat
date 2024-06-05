import { randomBytes } from "crypto";
import browserChat from "../src/index";
import obyte from "obyte"; // obyte.js client instance
import { readFileSync, writeFileSync } from "fs";
import { createObjDeviceKey, fromWif, toWif } from "../src/_texto/utils";
import { publicKeyCreate } from "secp256k1";

const testnet = true;
const wif = toWif(randomBytes(32), testnet);
const devicePrivKey = fromWif(wif, testnet).privateKey;
const devicePubKey = publicKeyCreate(devicePrivKey, true).toString('base64');
const objMyPermDeviceKey = createObjDeviceKey(devicePrivKey);
writeFileSync("./server.json", JSON.stringify({wif, devicePrivKey, objMyPermDeviceKey, devicePubKey}, null, 2))