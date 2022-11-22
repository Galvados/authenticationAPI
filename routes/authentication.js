const express = require('express');
const router = express.Router();

const authController = require('../controllers/authentication');

//register new user handle
router.post('/register', authController.register);
 
//login user handle
router.post('/login', authController.login);

//logout user handle
router.get('/logout', authController.logout);

//renew access token
router.post('/renew', authController.renew);

module.exports = router;