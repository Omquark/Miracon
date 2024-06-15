async function login(userInfo) {
    
    let { username, password } = userInfo;

    password = bytesToBase64(password);

    let response;

    try {
        response = await fetch(`http://${location.host}/login`,
            {
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password }),
                method: 'POST',
            });
    } catch (err) {
        console.log(err);
    }

    const data = await response.json();
    return data;
}

async function logout() {

    let response;

    try {
        response = await fetch(`http://${location.host}/logout`,
            {
                headers: {
                    'content-type': 'application/json',
                    'content-length': 0,
                },
                method: 'GET',
            });
    } catch (err) {
        console.log(err)
    }
}

function bytesToBase64(bytes) {
    const string = new TextEncoder().encode(bytes);
    const binString = String.fromCodePoint(...string);
    return btoa(binString);
}

module.exports = { login, logout }