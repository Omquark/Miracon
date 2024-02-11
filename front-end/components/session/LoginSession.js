const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { v4: uuidv4 } = require('uuid');

const serverName = 'miracon'; //Server Name, for the cookie
const secret = 'miracon'; //Cookie sercret
const maxAge = 24 * 60 * 60 * 1000; //hours * minutes * seconds  * milliseconds, max age of the cookie/session
const cacheSize = Infinity; //Max cache size of the store. This is a memory store, so Infinity could eat up a lot of RAM, if many sessions are made.
const checkPeriod = 24 * 60 * 60 * 1000; //How often to 'prune' sessions
const cookieExpire = 60 * 60 * 1000; //How long a session lasts

const LoginSessionOpts = {
    cookie: {
        httpOnly: true,
        maxAge: cookieExpire,
        sameSite: true,
        secure: false, //Set this true later if an https connection is established.
    },
    genid: () => uuidv4(), //Any crypto-secure RNG
    maxAge: maxAge,
    name: serverName, //Set later to minecraft server name
    resave: false,
    rolling: false,
    saveUninitialized: true,
    secret: secret,
    store: new MemoryStore({
        checkPeriod: checkPeriod, //ms in 1 day
        max: cacheSize, //Max size
        ttl: maxAge,
        stale: false,
    }),
}

module.exports = { LoginSessionOpts };