const express = require('express');
const fs = require('fs');
const {promisify} = require('util');
const Busboy = require('busboy');
const constants = require('./_helpers/constants');
const router = express.Router();

const uploadFolderName = constants.uploadFolderName;

const getFileDetails = promisify(fs.stat);

const uniqueAlphaNumericId = (() => {
    const heyStack = '0123456789abcdefghijklmnopqrstuvwxyz';
    const randomInt = () => Math.floor(Math.random() * Math.floor(heyStack.length));

    return (length = 24) => Array.from({length}, () => heyStack[randomInt()]).join('');
})();

const getFilePath = (fileName, fileId) => `./${uploadFolderName}/file-${fileId}-${fileName}`;


router.post('/upload-request', (req, res) => {
    if (!req.body || !req.body.fileName) {
        res.status(400).json({message: 'Missing "fileName"'});
    } else {
        const fileId = uniqueAlphaNumericId();
        fs.createWriteStream(getFilePath(req.body.fileName, fileId), {flags: 'w'});
        res.status(200).json({fileId});
    }
});

router.get('/upload-status', (req, res) => {
    if(req.query && req.query.fileName && req.query.fileId) {
        getFileDetails(getFilePath(req.query.fileName, req.query.fileId))
            .then((stats) => {
                res.status(200).json({totalChunkUploaded: stats.size});
            })
            .catch(err => {
                console.error('failed to read file', err);
                res.status(400).json({message: 'No file with such credentials', credentials: req.query});
            });
    }
});

router.post('/multi-upload', (req, res) => {
    const contentRange = req.headers['content-range'];
    const fileId = req.headers['x-file-id'];

    if (!contentRange) {
        console.log('Missing Content-Range');
        return res.status(400).json({message: 'Missing "Content-Range" header'});
    }

    if(!fileId) {
        console.log('Missing File Id');
        return res.status(400).json({message: 'Missing "X-File-Id" header'});
    }

    const match = contentRange.match(/bytes=(\d+)-(\d+)\/(\d+)/);

    if(!match) {
        console.log('Invalid Content-Range Format');
        return res.status(400).json({message: 'Invalid "Content-Range" Format'});
    }

    const rangeStart = Number(match[1]);
    const rangeEnd = Number(match[2]);
    const fileSize = Number(match[3]);

    if (rangeStart >= fileSize || rangeStart >= rangeEnd || rangeEnd > fileSize) {
        return res.status(400).json({message: 'Invalid "Content-Range" provided'});
    }

    const busboy = new Busboy({ headers: req.headers });

    busboy.on('file', (_, file, fileName) => {
        const filePath = getFilePath(fileName, fileId);
        if (!fileId) {
            req.pause();
        }

        getFileDetails(filePath)
            .then((stats) => {

                if (stats.size !== rangeStart) {
                    return res
                        .status(400)
                        .json({message: 'Bad "chunk" provided'});
                }

                file
                    .pipe(fs.createWriteStream(filePath, {flags: 'a'}))
                    .on('error', (e) => {
                        console.error('failed upload', e);
                        res.sendStatus(500);
                    });
            })
            .catch(err => {
                console.log('No File Match', err);
                res.status(400).json({ message: 'No file with such credentials', credentials: req.query });
            })
    });

    busboy.on('error', (e) => {
        console.error('failed upload', e);
        res.sendStatus(500);
    })

    busboy.on('finish', () => {
        res.sendStatus(200);
    });

    req.pipe(busboy);
});

module.exports = router;