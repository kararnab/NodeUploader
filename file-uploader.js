const express = require('express');
const multer = require('multer');
const tus = require('tus-node-server');
const app = express();
const uploadApp = express();

const uploadFolderName = 'uploadedFiles';
const server = new tus.Server({ path: `/${uploadFolderName}` });
server.datastore = new tus.FileStore({ directory: `./${uploadFolderName}` });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `${uploadFolderName}/`);
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const multi_upload = multer({
    storage,
    //limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
    fileFilter: (req, file, cb) => {
        cb(null, true);

        // if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        //     cb(null, true);
        // } else {
        //     cb(null, false);
        //     const err = new Error('Only .png, .jpg and .jpeg format allowed!')
        //     err.name = 'ExtensionError'
        //     return cb(err);
        // }
    },
}).array('multi-files')

app.post('/upload', (req, res) => {
    multi_upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
            return;
        } else if (err) {
            // An unknown error occurred when uploading.
            if (err.name === 'ExtensionError') {
                res.status(413).send({ error: { message: err.message } }).end();
            } else {
                res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
            }
            return;
        }

        // Everything went fine.
        // show file `req.files` show body `req.body`
        res.status(200).end('Your files uploaded.');
    })
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

uploadApp.all('*', server.handle.bind(server));
app.use('/uploads', uploadApp);

app.use('/public', express.static('public'))

app.listen(2000, function () {
    console.log("Server is running on port 2000");
});  