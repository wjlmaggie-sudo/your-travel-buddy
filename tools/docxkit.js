/* Minimal zero-dependency DOCX writer (zip + OOXML). */
"use strict";
const zlib = require("zlib");

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}
function dosTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}
function zip(files) {
  const stamp = dosTime(new Date());
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const raw = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, "utf8");
    const comp = zlib.deflateRawSync(raw, { level: 9 });
    const crc = crc32(raw);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(stamp.time, 10);
    lh.writeUInt16LE(stamp.date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    parts.push(lh, name, comp);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(stamp.time, 12);
    ch.writeUInt16LE(stamp.date, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);
    offset += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([Buffer.concat(parts), cd, eocd]);
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function runs(text, opts = {}) {
  const segs = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return segs
    .map((s) => {
      const bold = /^\*\*[^*]+\*\*$/.test(s) || opts.bold;
      const t = s.replace(/^\*\*|\*\*$/g, "");
      return (
        "<w:r><w:rPr>" +
        (bold ? "<w:b/>" : "") +
        (opts.italic ? "<w:i/>" : "") +
        (opts.mono ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>' : "") +
        (opts.color ? '<w:color w:val="' + opts.color + '"/>' : "") +
        (opts.size ? '<w:sz w:val="' + opts.size + '"/><w:szCs w:val="' + opts.size + '"/>' : "") +
        "</w:rPr>" +
        '<w:t xml:space="preserve">' + esc(t) + "</w:t></w:r>"
      );
    })
    .join("");
}

function para(text, o = {}) {
  const pPr =
    "<w:pPr>" +
    (o.style ? '<w:pStyle w:val="' + o.style + '"/>' : "") +
    (o.align ? '<w:jc w:val="' + o.align + '"/>' : "") +
    (o.indent ? '<w:ind w:left="' + o.indent + '" w:hanging="' + (o.hanging || 0) + '"/>' : "") +
    (o.before !== undefined || o.after !== undefined
      ? '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after || 0) + '"/>'
      : "") +
    (o.keepNext ? "<w:keepNext/>" : "") +
    "</w:pPr>";
  return "<w:p>" + pPr + (text ? runs(text, o) : "") + "</w:p>";
}

/* ---- public builders ---- */
const B = {
  title: (t) => para(t, { style: "Title", align: "center", after: 120 }),
  subtitle: (t) => para(t, { style: "Subtitle", align: "center", after: 240 }),
  h1: (t) => para(t, { style: "Heading1", keepNext: true }),
  h2: (t) => para(t, { style: "Heading2", keepNext: true }),
  h3: (t) => para(t, { style: "Heading3", keepNext: true }),
  p: (t, o) => para(t, Object.assign({ style: "Body" }, o || {})),
  small: (t) => para(t, { style: "Small" }),
  caption: (t) => para(t, { style: "Caption" }),
  bullet: (t) => para("\u2022\t" + t, { style: "Body", indent: 340, hanging: 220, after: 60 }),
  bullet2: (t) => para("\u2013\t" + t, { style: "Body", indent: 680, hanging: 220, after: 60 }),
  num: (t, n) => para(n + ".\t" + t, { style: "Body", indent: 380, hanging: 260, after: 60 }),
  spacer: (h) => para("", { after: h || 120 }),
  pageBreak: () => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
  mono: (t) => para(t, { style: "Mono", size: 16 }),
  note: (t) => para(t, { style: "Note" }),
};

function table(rows, opts = {}) {
  const n = rows[0].length;
  const pct = opts.widths || Array(n).fill(100 / n);
  const sum = pct.reduce((a, b) => a + b, 0);
  const total = 9360;
  const widths = pct.map((p) => Math.round((total * p) / sum));
  const border =
    "<w:tblBorders>" +
    ["top", "left", "bottom", "right", "insideH", "insideV"]
      .map((s) => '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="C3CCDD"/>')
      .join("") +
    "</w:tblBorders>";
  let xml =
    "<w:tbl><w:tblPr>" +
    '<w:tblW w:w="' + total + '" w:type="dxa"/>' +
    '<w:tblLayout w:type="fixed"/>' +
    border +
    '<w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>' +
    "</w:tblPr><w:tblGrid>" +
    widths.map((w) => '<w:gridCol w:w="' + w + '"/>').join("") +
    "</w:tblGrid>";

  rows.forEach((row, ri) => {
    const head = ri === 0 && opts.header !== false;
    xml += "<w:tr><w:trPr><w:cantSplit/>" + (head ? "<w:tblHeader/>" : "") + "</w:trPr>";
    row.forEach((cell, ci) => {
      const shade = head ? "E7EDF9" : ri % 2 === 0 ? "F7F9FC" : "FFFFFF";
      const lines = String(cell).split("\n");
      xml +=
        "<w:tc><w:tcPr>" +
        '<w:tcW w:w="' + widths[ci] + '" w:type="dxa"/>' +
        '<w:shd w:val="clear" w:color="auto" w:fill="' + shade + '"/>' +
        '<w:vAlign w:val="top"/>' +
        "</w:tcPr>" +
        lines
          .map(
            (ln) =>
              "<w:p><w:pPr>" +
              '<w:pStyle w:val="TableText"/>' +
              '<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>' +
              "</w:pPr>" +
              (head ? '<w:r><w:rPr><w:b/><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr><w:t xml:space="preserve">' + esc(ln) + "</w:t></w:r>" : runs(ln, { size: 17 })) +
              "</w:p>"
          )
          .join("");
      xml += "</w:tc>";
    });
    xml += "</w:tr>";
  });
  xml += "</w:tbl>" + '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>';
  return xml;
}
B.table = table;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="1B2433"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Body"><w:name w:val="Body"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="1200" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:color w:val="44546A"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Body"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="140"/><w:outlineLvl w:val="0"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="4F8CFF"/></w:pBdr></w:pPr><w:rPr><w:b/><w:color w:val="1F3864"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Body"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="2E5496"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Body"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:color w:val="3B5C8F"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="60" w:after="160"/></w:pPr><w:rPr><w:i/><w:color w:val="6B7A90"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60"/></w:pPr><w:rPr><w:color w:val="5A6B85"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Mono"><w:name w:val="Mono"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:basedOn w:val="Body"/><w:pPr><w:spacing w:before="60" w:after="140"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="FFB454"/></w:pBdr><w:ind w:left="220"/></w:pPr><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>
</w:styles>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

function build(bodyXml, meta) {
  const document =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    bodyXml +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/>' +
    "</w:sectPr></w:body></w:document>";

  const core =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    "<dc:title>" + esc(meta.title) + "</dc:title>" +
    "<dc:subject>" + esc(meta.subject) + "</dc:subject>" +
    "<dc:creator>" + esc(meta.author) + "</dc:creator>" +
    "<cp:lastModifiedBy>" + esc(meta.author) + "</cp:lastModifiedBy>" +
    '<dcterms:created xsi:type="dcterms:W3CDTF">' + meta.date + "T09:00:00Z</dcterms:created>" +
    '<dcterms:modified xsi:type="dcterms:W3CDTF">' + meta.date + "T09:00:00Z</dcterms:modified>" +
    "<cp:keywords>project management, AiTravel, travel booking, AI</cp:keywords>" +
    "</cp:coreProperties>";

  const app =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AiTravel PMO</Application></Properties>';

  return zip([
    { name: "[Content_Types].xml", data: CONTENT_TYPES },
    { name: "_rels/.rels", data: ROOT_RELS },
    { name: "docProps/core.xml", data: core },
    { name: "docProps/app.xml", data: app },
    { name: "word/document.xml", data: document },
    { name: "word/styles.xml", data: STYLES },
    { name: "word/_rels/document.xml.rels", data: DOC_RELS },
  ]);
}

module.exports = { B, table, build };
