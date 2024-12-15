function bytesToBase64(bytes) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

function bytesFromBase64(bytes) {
  const string = new TextEncoder().encode(bytes);
  const binString = String.fromCodePoint(...string);
  return atob(binString);
}

module.exports = { bytesToBase64, bytesFromBase64 }