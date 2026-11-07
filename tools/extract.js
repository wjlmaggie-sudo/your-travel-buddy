"use strict";
const fs = require("fs");
const zlib = require("zlib");

const file = process.argv[2];
const buf = fs.readFileSync(file);

/* locate EOCD */
let eocd = -1;
for (let i = buf.length - 22; i >= 0; i--) {
  if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
}
if (eocd < 0) throw new Error("not a zip");
const count = buf.readUInt16LE(eocd + 10);
let off = buf.readUInt32LE(eocd + 16);

const entries = {};
for (let n = 0; n < count; n++) {
  if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("bad central header");
  const method = buf.readUInt16LE(off + 10);
  const csize = buf.readUInt32LE(off + 20);
  const nameLen = buf.readUInt16LE(off + 28);
  const extraLen = buf.readUInt16LE(off + 30);
  const cmtLen = buf.readUInt16LE(off + 32);
  const localOff = buf.readUInt32LE(off + 42);
  const name = buf.toString("utf8", off + 46, off + 46 + nameLen);

  const lNameLen = buf.readUInt16LE(localOff + 26);
  const lExtraLen = buf.readUInt16LE(localOff + 28);
  const dataStart = localOff + 30 + lNameLen + lExtraLen;
  const raw = buf.subarray(dataStart, dataStart + csize);
  entries[name] = method === 0 ? raw : zlib.inflateRawSync(raw);

  off += 46 + nameLen + extraLen + cmtLen;
}

const doc = entries["word/document.xml"];
if (!doc) throw new Error("no document.xml");

let xml = doc.toString("utf8");
xml = xml.replace(/<w:p [^>]*>|<w:p>/g, "\n<PARA>");
xml = xml.replace(/<w:tab\/>/g, "\t");
const text = xml
  .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (m, t) =>
    t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
  )
  .replace(/<[^>]+>/g, "")
  .replace(/\n{2,}/g, "\n")
  .trim();

console.log(text);
console.error("\n--- chars:", text.length, "entries:", Object.keys(entries).length);
