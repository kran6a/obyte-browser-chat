import wif from 'wif';
import { publicKeyCreate, sign as ecdsaSign, verify as ecdsaVerify } from 'secp256k1';
import { randomBytes, createHash, createECDH, createCipheriv, createDecipheriv, type ECDH } from 'crypto';
import chash from "./chash";

const STRING_JOIN_CHAR = "\x00";

export function deriveSharedSecret(ecdh: ECDH, peerB64Pubkey: string) {
  return createHash('sha256')
    .update(ecdh.computeSecret(peerB64Pubkey, 'base64'))
    .digest()
    .subarray(0, 16);
}

export function createEncryptedPackage(json: object, recipientDevicePubkey: string) {
  const text = JSON.stringify(json);
  const ecdh = createECDH('secp256k1');
  const senderEphemeralPubkey = ecdh.generateKeys('base64', 'compressed');
  const sharedSecret = deriveSharedSecret(ecdh, recipientDevicePubkey);
  // we could also derive iv from the unused bits of ecdh.computeSecret() and save some bandwidth
  const iv = randomBytes(12); // 128 bits (16 bytes) total, we take 12 bytes for random iv and leave 4 bytes for the counter
  const cipher = createCipheriv('aes-128-gcm', sharedSecret, iv);
  const encryptedMessageBuf = cipher.update(text, 'utf8');
  cipher.final();
  const encryptedMessage = encryptedMessageBuf.toString('base64');
  const authtag = cipher.getAuthTag();
  return {
    encrypted_message: encryptedMessage,
    iv: iv.toString('base64'),
    authtag: authtag.toString('base64'),
    dh: {
      sender_ephemeral_pubkey: senderEphemeralPubkey,
      recipient_ephemeral_pubkey: recipientDevicePubkey
    }
  };
}

export function decryptPackage(objEncryptedPackage: any, objMyTempDeviceKey: any) {
  const priv_key = objMyTempDeviceKey.priv;
  if (objMyTempDeviceKey.use_count)
    objMyTempDeviceKey.use_count++;
  else objMyTempDeviceKey.use_count = 1;

  const ecdh = createECDH('secp256k1');
  
  ecdh.generateKeys('base64', 'compressed');
  ecdh.setPrivateKey(priv_key);
  const shared_secret = deriveSharedSecret(ecdh, objEncryptedPackage.dh.sender_ephemeral_pubkey);
  const iv = Buffer.from(objEncryptedPackage.iv, 'base64');
  const decipher = createDecipheriv('aes-128-gcm', shared_secret, iv);
  const authtag = Buffer.from(objEncryptedPackage.authtag, 'base64');
  decipher.setAuthTag(authtag);
  const enc_buf = Buffer.from(objEncryptedPackage.encrypted_message, 'base64');

  const decrypted_message_buf = decipher.update(enc_buf);
  decipher.final();
  const decrypted_message = decrypted_message_buf.toString('utf8');
  const json = JSON.parse(decrypted_message);
  if (json.encrypted_package) {
    return decryptPackage(json.encrypted_package, objMyTempDeviceKey);
  }
  else {
    return json;
  }
}

export function createObjDeviceKey(priv: Buffer) {
  try {
    return { priv, pub_b64: Buffer.from(publicKeyCreate(priv, true)).toString('base64') };
  } catch (e) {
    console.log("createObjDeviceKey err ", e)
  }
}

export function toWif(privateKey: Buffer, testnet: boolean) {
  const version = testnet ? 239 : 128;
  return wif.encode(version, privateKey, false);
}

export function fromWif(string: string, testnet: boolean) {
  const version = testnet ? 239 : 128;
  return wif.decode(string, version);
}

export function sign(hash: Buffer, privateKey: Buffer) {
  try{
    return Buffer.from(ecdsaSign(hash, privateKey).signature).toString('base64');
  } catch (e) {
    console.error("sign error", e)
  }
  
}

export function verify(hash: Buffer, b64Sig: string, b64Pubkey: string) {
  try {
    return ecdsaVerify(hash, Buffer.from(b64Sig, 'base64'), Buffer.from(b64Pubkey, 'base64'));
  } catch (e) {
    return false;
  }
}

export const generatePaymentMessage = (objPaymentRequest: any) => {
  return Buffer.from(JSON.stringify(objPaymentRequest)).toString('base64');
}

function cleanNullsDeep(obj: Record<string, any>) {
  Object.keys(obj).forEach(function (key) {
    if (obj[key] === null)
      delete obj[key];
    else if (typeof obj[key] === 'object') // array included
      cleanNullsDeep(obj[key]);
  });
}

export function getDeviceMessageHashToSign(objDeviceMessage: any) {
  const objNakedDeviceMessage = structuredClone(objDeviceMessage);
  delete objNakedDeviceMessage.signature;
  cleanNullsDeep(objNakedDeviceMessage); // device messages have free format and we can't guarantee absence of malicious fields
  return createHash("sha256").update(getSourceString(objNakedDeviceMessage), "utf8").digest();
}

export function getDeviceAddress(b64_pubkey: string) {
  return ('0' + getChash160(b64_pubkey));
}

function getChash160(obj: string | object) {
  return chash.getChash160(getSourceString(obj));
}

export function getSourceString(obj: string | object) {
  const arrComponents: string[] = [];
  function extractComponents(variable: any) {
    if (variable === null)
      throw Error("null value in " + JSON.stringify(obj));
    switch (typeof variable) {
      case "string":
        arrComponents.push("s", variable);
        break;
      case "number":
        arrComponents.push("n", variable.toString());
        break;
      case "boolean":
        arrComponents.push("b", variable.toString());
        break;
      case "object":
        if (Array.isArray(variable)) {
          if (variable.length === 0)
            throw Error("empty array in " + JSON.stringify(obj));
          arrComponents.push('[');
          for (let i = 0; i < variable.length; i++)
            extractComponents(variable[i]);
          arrComponents.push(']');
        }
        else {
          const keys = Object.keys(variable).sort();
          if (keys.length === 0)
            throw Error("empty object in " + JSON.stringify(obj));
          keys.forEach(function (key) {
            if (typeof variable[key] === "undefined")
              throw Error("undefined at " + key + " of " + JSON.stringify(obj));
            arrComponents.push(key);
            extractComponents(variable[key]);
          });
        }
        break;
      default:
        throw Error("hash: unknown type=" + (typeof variable) + " of " + variable + ", object: " + JSON.stringify(obj));
    }
  }

  extractComponents(obj);
  return arrComponents.join(STRING_JOIN_CHAR);
}