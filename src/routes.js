
const express = require('express');
const router = express.Router();

const AuthController = require('./controllers/AuthController');
const AdsController = require('./controllers/AdsController');
const UserController = require('./controllers/UserController');

router.get('/ping', (req, res) => {
    res.json({pong: true});
});

router.get('/states', UserController.getStates);

router.post('/user/signin', AuthController.signin);

router.post('/user/signup', AuthController.signup);

router.get('/user/me', UserController.info);

module.exports = router;