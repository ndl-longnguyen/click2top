/* eslint-disable */
// Simple Node.js PNG generator with zlib
import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 2; // Color type: 2 (RGB)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per scanline
  const rowBytes = width * 3;
  const rawData = Buffer.alloc((rowBytes + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawData[rowOffset] = 0; // Filter type 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist <= radius) {
        // Golden Coin circle with bevel
        const bevel = Math.max(0, 1 - (radius - dist) / 10);
        rawData[pxOffset] = Math.min(255, Math.floor(245 - bevel * 40));     // R
        rawData[pxOffset + 1] = Math.min(255, Math.floor(158 - bevel * 30)); // G
        rawData[pxOffset + 2] = Math.min(255, Math.floor(11 + bevel * 20));  // B
      } else {
        // Dark background #090d16
        rawData[pxOffset] = 9;
        rawData[pxOffset + 1] = 13;
        rawData[pxOffset + 2] = 22;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crc]);
}

// CRC32 implementation
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    crc32.table = table;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

fs.writeFileSync('public/icon-192.png', createPng(192, 192, 245, 158, 11));
fs.writeFileSync('public/icon-512.png', createPng(512, 512, 245, 158, 11));
fs.writeFileSync('public/icon-maskable.png', createPng(512, 512, 245, 158, 11));
console.log('Icons generated successfully!');
