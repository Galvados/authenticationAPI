passport = require('passport');
jwt = require('jsonwebtoken');
fs = require('fs');
bcrypt = require('bcrypt');
const logger = require('../lib/logger').logger;
const BasicError = require('../lib/errorHandler/basicError');
const UserRepository = require("../repositories/user");
const decode = require('jwt-decode');
/**
 * Authenticate user using passport local 
 * @param {*} req Express req middleware object
 * @param {*} res Express res middleware object
 * @param {*} next Express next middleware object
 * @returns user object
 */
async function passportAuthenticate(req, res, next) {
    return new Promise((resolve, reject) => {
        passport.authenticate('local', function (err, user, info, status) {
            if (!status)
                status = 400;
            if (err) {
                logger.error(err);
                return reject(new BasicError('internal server error', 500));
            }
            if (!user) {
                if (!info) {
                    info = {};
                    info.message = 'Incorrect username or password';
                    status = 400;
                }
                return reject(new BasicError(info.message, status));
            }

            return resolve(user);
        })(req, res, next);
    });
}

/**
 * Generates access token
 * @param {*} key Private key for RS256 sign
 * @param {*} user user object
 * @returns access token
 */
function generateAccessToken(key, user, expiresIn) {
    return jwt.sign({ type: 'access' }, key, { algorithm: 'RS256', expiresIn: expiresIn, subject: user._id.toString() });
}

/**
 * Generates refresh token
 * @param {*} key Private key for RS256 sign
 * @param {*} user user object
 * @returns refresh token
 */
function generateRefreshToken(key, user, expiresIn) {
    return jwt.sign({ type: 'refresh' }, key, { algorithm: 'RS256', expiresIn: expiresIn, subject: user._id.toString() });
}

module.exports = {
    /**
     * Authenticate user and return AccessToken and Refresh token
     * @param {*} applicationType Application type name to invalidate previous same type kind refresh tokens 
     * @param {*} key Private key for generating tokens
     * @param {*} req Express req middleware object
     * @param {*} res Express res middleware object
     * @param {*} next Express next middleware object
     * @returns Object containing access token and refresh token
     */
    login: async function (applicationType, key, req, res, next) {
        //log in
        const user = await passportAuthenticate(req, res, next);

        //generate new tokens
        const accessToken = generateAccessToken(key, user, process.env.accessTokenExpiresIn);
        const refreshToken = generateRefreshToken(key, user, process.env.refreshTokenExpiresIn);

        //invalidate previous tokens 
        const { exp } = decode(refreshToken);
        for (let index = 0; index < user.refreshTokens.length; index++) {
            const token = user.refreshTokens[index];
            if (token.applicationType == applicationType)
                token.invalidated = true;
        }

        //store new token in the database
        user.refreshTokens.push({ expiresAt: new Date((exp * 1000)), token: refreshToken, invalidated: false, applicationType: applicationType });
        await user.save();

        return { accessToken: accessToken, refreshToken: refreshToken };
    },

    /**
     * Registers user to system
     * @param {*} key Private key for generating tokens
     * @param {*} email new user's email adress
     * @param {*} password new user's password
     * @returns true if registered is compleated
     */
    register: async function (email, password) {
        return UserRepository.findOneByEmail(email).then(async (user) => {
            if (user)
                throw new BasicError('User already exists', 400);

            const salt = await bcrypt.genSalt(10);
            const enryptedPassword = await bcrypt.hash(password, salt);
            await UserRepository.createUser({ email: email, password: enryptedPassword });
            return true;
        })
    },
    /**
     * Invalidates refresh token in database
     * @param {*} publicKey public key to decrypt jwt refresh token
     * @param {*} refreshToken refresh token to invalidate
     */
    logout: async function (publicKey, refreshToken) {
        try {
            var decodedToken = jwt.verify(refreshToken, publicKey);
            if (decodedToken.type != 'refresh')
                throw new BasicError('not valid refresh token', 400);
            return UserRepository.findOneById(decodedToken.sub)
                .then(async (user) => {
                    if (!user)
                        throw new BasicError('user does not exist', 400);

                    //invalidate stored tokens
                    for (let index = 0; index < user.refreshTokens.length; index++) {
                        const token = user.refreshTokens[index];
                        if (token.token == refreshToken && token.invalidated == false) {
                            var tokenFound = token;
                            token.invalidated = true;
                        }
                    }
                    if (!tokenFound)
                        throw new BasicError('token not found', 400);
                    await user.save();
                });
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError)
                throw new BasicError('jwt expired', 400);
            else
                throw error;
        }
    },
    /**
     * Renews refresh and access token and invalidates previous refresh tokens for passed application type
     * @param {*} privateKey private key to encrypt new token
     * @param {*} publicKey public key to decrypt jwt refresh token
     * @param {*} refreshToken refresh token to renew tokens
     */
    renew: async function (privateKey, publicKey, refreshToken) {
        try {
            var decodedToken = jwt.verify(refreshToken, publicKey);
            if (decodedToken.type != 'refresh')
                throw new BasicError('not valid refresh token', 400);
            return UserRepository.findOneById(decodedToken.sub)
                .then(async (user) => {
                    if (!user)
                        throw new BasicError('user does not exist', 400);

                    //check if passed token is not invalidated
                    for (let index = 0; index < user.refreshTokens.length; index++) {
                        const token = user.refreshTokens[index];
                        if (token.token == refreshToken && token.invalidated == false)
                            var tokenFound = token;
                    }
                    if (!tokenFound)
                        throw new BasicError('token not found', 400);

                    //invalidate old token
                    for (let index = 0; index < user.refreshTokens.length; index++) {
                        const token = user.refreshTokens[index];
                        if (token.applicationType == tokenFound.applicationType)
                            token.invalidated = true;
                    }

                    //generate and return new tokens
                    const accessToken = generateAccessToken(privateKey, user, process.env.accessTokenExpiresIn);
                    const newRefreshToken = generateRefreshToken(privateKey, user, process.env.refreshTokenExpiresIn);
                    const { exp } = decode(newRefreshToken);
                    user.refreshTokens.push({ expiresAt: new Date((exp * 1000)), token: newRefreshToken, invalidated: false, applicationType: tokenFound.applicationType });
                    await user.save();
                    return { accessToken: accessToken, refreshToken: newRefreshToken };
                });
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError)
                throw new BasicError('jwt expired', 400);
            else
                throw error;
        }

    }
} 