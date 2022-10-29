const express = require('express');
const constants = require("./_helpers/constants");
const multer = require("multer");
const router = express.Router();

const uploadFolderName = constants.uploadFolderName;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `${uploadFolderName}/`);
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
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

router.post('/basic-upload', (req, res) => {
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

module.exports = router;