function bytesToBase64(bytes) {
  const binBuffer = Buffer.from(bytes);
  return binBuffer.toString('base64');
}

function bytesFromBase64(bytes) {
  return Buffer.from(bytes, 'base64');
}

module.exports = { bytesToBase64, bytesFromBase64 }