const BasicError = require('../lib/errorHandler/basicError');
const user = require('../services/user');
const validators = require('../validators/authentication');
const joi = require('joi');
const logger = require('../lib/logger').logger;

/**
 * Register user handler
 * @param {*} req express middleware request object
 * @param {*} res express middleware result object
 * @param {*} next express middleware next object
 * @returns code 200 response if compleated
 */
exports.register = async (req, res, next) => {
    try {
        await validators.registerSchema.validateAsync(req.body);
    } catch (error) {
        if (error instanceof joi.ValidationError)
            return next(new BasicError(error, 400));
        else
            return next(error);
    }
    const { email, password } = req.body;
    await user.register(email, password)
        .then(() => {
            res.status(200).send('');
        })
        .catch(error => {
            logger.error(error);
            next(error);
        });

}

/**
 * Login user handler. Generates new tokens returns it to the client
 * @param {*} req express middleware request object
 * @param {*} res express middleware result object
 * @param {*} next express middleware next object
 * @returns JSON with refresh and access Token {refreshToken: "token", accessToken: "token"}
 */
exports.login = async (req, res, next) => {
    try {
        try {
            await validators.loginSchema.validateAsync(req.body);
        } catch (error) {
            if (error instanceof joi.ValidationError)
                return next(new BasicError(error, 400));
            else
                return next(error);
        }
        const { applicationType } = req.body;
        const tokens = await user.login(applicationType, fs.readFileSync('./privateKey.txt'), req, res, next);
        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    }
    catch (error) {
        logger.error(error);
        next(error);
    }
}

/**
 * Invalidate user's stored refresh tokens
 * @param {*} req express middleware request object
 * @param {*} res express middleware result object
 * @param {*} next express middleware next object
 */
exports.logout = async (req, res) => {
    try {
        try {
            await validators.logoutSchema.validateAsync(req.body);
        } catch (error) {
            if (error instanceof joi.ValidationError)
                return next(new BasicError(error, 400));
            else {
                logger.error(error);
                return next(error);
            }
        }
        const { refreshToken } = req.body;
        await user.logout(fs.readFileSync('./publicKey.txt'), refreshToken);

        res.status(200).send('');
    }
    catch (error) {
        logger.error(error);
        next(error);
    }
}

/**
 * Generates new access and refresh tokens for user with valid refresh token
 * @param {*} req express middleware request object
 * @param {*} res express middleware result object
 * @param {*} next express middleware next object
 */
exports.renew = async (req, res, next) => {
    try {
        try {
            await validators.renewSchema.validateAsync(req.body);
        } catch (error) {
            if (error instanceof joi.ValidationError)
                return next(new BasicError(error, 400));
            else
                return next(error);
        }
        const { refreshToken } = req.body;
        const tokens = await user.renew(fs.readFileSync('./privateKey.txt'), fs.readFileSync('./publicKey.txt'), refreshToken);
        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    }
    catch (error) {
        logger.error(error);
        next(error);
    }
}