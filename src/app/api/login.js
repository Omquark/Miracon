const { requestApi } = require("./client");

function bytesToBase64(value) {
  const encoded = new TextEncoder().encode(value);
  const binary = String.fromCodePoint(...encoded);
  return btoa(binary);
}

async function login(userInfo) {
  const username = userInfo?.username || "";
  const password = bytesToBase64(userInfo?.password || "");

  return requestApi("/login", {
    method: "POST",
    body: { username, password },
  });
}

async function logout() {
  return requestApi("/logout", { method: "GET" });
}

module.exports = { login, logout };

