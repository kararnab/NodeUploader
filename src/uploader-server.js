const express = require('express');
const cors = require('cors');
const app = express();
const errorHandler = require('./_helpers/error_handler');
const basicUploader = require('./basicUploader');
const advanceUploader = require('./advanceUploader');
const multipleUploader = require('./multipleUploader');
const constants = require("./_helpers/constants");

const port = process.env.PORT || constants.port

app.use(express.static('src/public')); //app.use('/public', express.static('src/public'))

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/ip-address', (req, res)=> {
    // req.connection is deprecated
    const conRemoteAddress = req.connection?.remoteAddress
    // req.socket is said to replace req.connection
    const sockRemoteAddress = req.socket?.remoteAddress
    // some platforms use x-real-ip
    const xRealIP = req.headers['x-real-ip']
    // most proxies use x-forwarded-for
    const xForwardedForIP = (() => {
        const xForwardedFor = req.headers['x-forwarded-for']
        if (xForwardedFor) {
            // The x-forwarded-for header can contain a comma-separated list of
            // IP's. Further, some are comma separated with spaces, so whitespace is trimmed.
            const ips = xForwardedFor.split(',').map(ip => ip.trim())
            return ips[0]
        }
    })()
    // prefer x-forwarded-for and fallback to the others
    res.status(200).end(xForwardedForIP || xRealIP || sockRemoteAddress || conRemoteAddress)
})

app.use(basicUploader);
app.use(multipleUploader);
app.use(advanceUploader);

app.use(errorHandler); // global error handler

app.listen(port, () => console.log(`Server listening on port: ${port}`));