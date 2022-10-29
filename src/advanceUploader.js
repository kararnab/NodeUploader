const express = require('express');
const constants = require('./_helpers/constants');
const tus = require('tus-node-server');
const router = express.Router();
const uploadApp = express();

const uploadFolderName = constants.uploadFolderName;
const server = new tus.Server({ path: `/${uploadFolderName}` });
server.datastore = new tus.FileStore({ directory: `./${uploadFolderName}` });

router.all('*', server.handle.bind(server));
router.use('/uploads', uploadApp);

module.exports = router;