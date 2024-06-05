import crypto from "crypto";
import base32 from "thirty-two";

const PI = "14159265358979323846264338327950288419716939937510";
const zeroString = "00000000";

const arrRelativeOffsets = PI.split("");

function checkLength(chash_length: number){
	if (chash_length !== 160 && chash_length !== 288)
		throw Error("unsupported c-hash length: "+chash_length);
}

function calcOffsets(chash_length: number){
	checkLength(chash_length);
	const arrOffsets = [];
	let offset = 0;
	let index = 0;

	for (let i=0; offset<chash_length; i++){
		const relative_offset = parseInt(arrRelativeOffsets[i] as string);
		if (relative_offset === 0)
			continue;
		offset += relative_offset;
		if (chash_length === 288)
			offset += 4;
		if (offset >= chash_length)
			break;
		arrOffsets.push(offset);
		//console.log("index="+index+", offset="+offset);
		index++;
	}

	if (index != 32)
		throw Error("wrong number of checksum bits");
	
	return arrOffsets;
}

const arrOffsets160 = calcOffsets(160);
const arrOffsets288 = calcOffsets(288);

function mixChecksumIntoCleanData(binCleanData: string, binChecksum: string){
	if (binChecksum.length !== 32)
		throw Error("bad checksum length");
	const len = binCleanData.length + binChecksum.length;
	let arrOffsets: number[];
	if (len === 160)
		arrOffsets = arrOffsets160;
	else if (len === 288)
		arrOffsets = arrOffsets288;
	else
		throw Error("bad length="+len+", clean data = "+binCleanData+", checksum = "+binChecksum);
	const arrFrags = [];
	const arrChecksumBits = binChecksum.split("");
	let start = 0;
	for (let i=0; i<arrOffsets.length; i++){
		const end = (arrOffsets[i] as number) - i;
		arrFrags.push(binCleanData.substring(start, end));
		arrFrags.push(arrChecksumBits[i]);
		start = end;
	}
	// add last frag
	if (start < binCleanData.length)
		arrFrags.push(binCleanData.substring(start));
	return arrFrags.join("");
}

function buffer2bin(buf: Uint8Array){
	const bytes = [];
	for (var i=0; i<buf.length; i++){
		let bin = (buf[i] as number).toString(2);
		if (bin.length < 8) // pad with zeros
			bin = zeroString.substring(bin.length, 8) + bin;
		bytes.push(bin);
	}
	return bytes.join("");
}

function bin2buffer(bin: string){
	const len = bin.length/8;
	const buf = Buffer.alloc(len);
	for (let i=0; i<len; i++)
		buf[i] = parseInt(bin.substr(i*8, 8), 2);
	return buf;
}

function getChecksum(clean_data: Uint8Array){
	const full_checksum = crypto.createHash("sha256").update(clean_data).digest();
	const checksum = Buffer.from([full_checksum[5] as number, full_checksum[13] as number, full_checksum[21] as number, full_checksum[29] as number]);
	return checksum;
}

function getChash(data: string, chash_length: number){
	checkLength(chash_length);
	const hash = crypto.createHash((chash_length === 160) ? "ripemd160" : "sha256").update(data, "utf8").digest();
	const truncated_hash = (chash_length === 160) ? hash.subarray(4) : hash; // drop first 4 bytes if 160
	const checksum = getChecksum(truncated_hash);
	
	const binCleanData = buffer2bin(truncated_hash);
	const binChecksum = buffer2bin(checksum);
	const binChash = mixChecksumIntoCleanData(binCleanData, binChecksum);
	const chash = bin2buffer(binChash);
	const encoded = (chash_length === 160) ? base32.encode(chash).toString() : chash.toString('base64');
	return encoded;
}

function getChash160(data: string){
	return getChash(data, 160);
}

export default {
	getChash160
}