export default async function login(userInfo) {
    let { username, password } = userInfo;

    password = bytesToBase64(new TextEncoder().encode(password));

    let response;

    try {
        response = await fetch(`http://${location.hostname}:3011/login`,
            {
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password }),
                method: 'POST',
                mode: 'cors'
            });
    } catch (err) {
        console.log(err);
    }

    const data = await response.json();
    console.log(data);
    return data;
}

function bytesToBase64(bytes) {
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
}