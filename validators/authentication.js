const Joi = require('joi');
const userValidation = require('./user');

module.exports = {
    registerSchema:Joi.object({
        email: userValidation.email,
        password: userValidation.password
    }),
    loginSchema: Joi.object({
        applicationType: Joi.string().min(1).max(25),
        email: userValidation.email,
        password: Joi.string()
    }),
    renewSchema: Joi.object({
        refreshToken: Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
    }),
    logoutSchema: Joi.object({
        refreshToken: Joi.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
    }),

}