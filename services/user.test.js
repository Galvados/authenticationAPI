jest.mock('passport');
const logger = require('../lib/logger');
jest.mock('../lib/logger');
logger.logger = jest.fn();
logger.logger.error = jest.fn();
const userRepository = require('../repositories/user.js');
jest.mock('../repositories/user.js');
const userService = require("../services/user");
const fs = require("fs");
const decode = require('jwt-decode');
const BasicError = require('../lib/errorHandler/basicError');

const privateKey = fs.readFileSync('tests_resources/privateKey.txt');
const publicKey = fs.readFileSync('tests_resources/publicKey.txt');

afterEach(() => {
    jest.clearAllMocks();
});

describe('Login function', () => {
    test('Login - valid username and password', async () => {
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const user = { _id: 10, refreshTokens: [], save: jest.fn() };
        const date = new Date();

        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, user, null, null)
            });
            return innerPassportFunction;
        });

        process.env.accessTokenExpiresIn = 10 * 1000 * 60;
        process.env.refreshTokenExpiresIn = 11 * 1000 * 60;


        //check if authenticate method is executed with proper parameters
        loginResponse = await userService.login('mobile', privateKey, req, res, next);
        expect(innerPassportFunction.mock.calls.length).toBe(1);
        expect(innerPassportFunction.mock.calls[0][0]).toBe(req);
        expect(innerPassportFunction.mock.calls[0][1]).toBe(res);
        expect(innerPassportFunction.mock.calls[0][2]).toBe(next);

        //check jwt's 
        const decodedRefreshToken = decode(loginResponse.refreshToken);
        expect(decodedRefreshToken.type).toBe('refresh');
        expect(Number(decodedRefreshToken.sub)).toBe(10);
        expect(new Date(decodedRefreshToken.exp * 1000).getTime()).toBeLessThan(new Date().getTime() + 1000 * 60 * 11);
        expect(new Date(decodedRefreshToken.exp * 1000).getTime()).toBeGreaterThan(date.getTime() + 1000 * 60 * 10);

        const decodedAccessToken = decode(loginResponse.accessToken);
        expect(decodedAccessToken.type).toBe('access');
        expect(Number(decodedAccessToken.sub)).toBe(10);
        expect(new Date(decodedAccessToken.exp * 1000).getTime()).toBeLessThan(new Date().getTime() + 1000 * 60 * 10);
        expect(new Date(decodedAccessToken.exp * 1000).getTime()).toBeGreaterThan(date.getTime() + 1000 * 60 * 9);

        //check stored refresh token
        expect(user.save).toBeCalledTimes(1);
        expect(user.refreshTokens.length).toBe(1);
        expect(user.refreshTokens[0].token).toBe(loginResponse.refreshToken);
        expect(user.refreshTokens[0].applicationType).toBe('mobile');
        expect(user.refreshTokens[0].invalidated).toBe(false);
    });


    test('Login - invalid username and password', async () => {
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const user = { _id: 10 };
        const date = new Date();

        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, null, null, 300)
            });
            return innerPassportFunction;
        });

        let loginResponse = userService.login('', null, req, res, next);


        //check if authenticate method is executed with proper parameters
        expect(innerPassportFunction.mock.calls.length).toBe(1);
        expect(loginResponse).rejects.toThrow(new BasicError('Incorrect username or password'));

    });

    test('Login - invalid username and password', async () => {
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const user = { _id: 10 };
        const date = new Date();

        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, null, null, 300)
            });
            return innerPassportFunction;
        });

        let loginResponse = userService.login('', null, req, res, next);


        //check if authenticate method is executed with proper parameters
        expect(innerPassportFunction.mock.calls.length).toBe(1);
        expect(loginResponse).rejects.toThrow(new BasicError('Incorrect username or password'));

    });

    test('Login - passport error', async () => {
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const user = { _id: 10 };
        const date = new Date();

        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, null, { message: "test" }, 300)
            });
            return innerPassportFunction;
        });

        //check if authenticate method is executed with proper parameters
        let loginResponse = userService.login('', null, req, res, next).catch(error => {
            expect(error.status).toBe(300);
            throw error;
        });
        expect(innerPassportFunction.mock.calls.length).toBe(1);
        expect(loginResponse).rejects.toThrow(new BasicError('test'));

    });

    test('Login - passport login error', async () => {
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        
        const user = { _id: 10 };
        const date = new Date();

        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(new Error('test'), null, null, 300)
            });
            return innerPassportFunction;
        });

        //check if authenticate method is executed with proper parameters
        let loginResponse = userService.login('', null, req, res, next).catch(error => {
            expect(error.status).toBe(500);
            throw error;
        });
        expect(innerPassportFunction.mock.calls.length).toBe(1);
        expect(loginResponse).rejects.toThrow(new BasicError('internal server error'));
    });

});

describe('Register function', () => {


    test('Register - valid user', async () => {
        userRepository.findOneByEmail = jest.fn().mockImplementation(() => { return new Promise((resolve, reject) => { resolve(null) }) });
        userRepository.createUser = jest.fn().mockImplementation(() => { return new Promise((resolve, reject) => { resolve({ _id: 10 }) }) });

        let registerResponse = await userService.register('test@gmail.com', 'test123');
        var password = userRepository.createUser.mock.calls[0][0].password;

        var passwordValid = await new Promise((resolve, reject) => {
            bcrypt.compare('test123', password, (err, isCorrect) => {
                if (err) return reject(err);
                if (isCorrect) {
                    return resolve(true);
                } else {
                    return resolve(false);
                }
            });
        })

        expect(userRepository.createUser).toBeCalledTimes(1);
        expect(userRepository.createUser).toBeCalledWith(expect.objectContaining({ email: 'test@gmail.com' }));
        expect(passwordValid).toBe(true);

    });

    test('Register - user already exists', async () => {
        userRepository.findOneByEmail = jest.fn().mockImplementation(() => { return new Promise((resolve, reject) => { resolve({ _id: 10 }) }) });
        userRepository.createUser = jest.fn().mockImplementation(() => { return new Promise((resolve, reject) => { resolve({ _id: 10 }) }) });

        let registerResponse = userService.register(privateKey, 'test@gmail.com', 'test123').catch(error => {
            expect(error.status).toBe(400);
            throw error;
        });
        expect(registerResponse).rejects.toThrow(new BasicError('User already exists'))
    });
});

describe('Logout', () => {
    test('Logout - invalid refresh token', async () => {
        const logoutResult = userService.logout(publicKey, '');

        expect(logoutResult).rejects.toThrow();
    });

    test('Logout - invalidate the sent valid refresh key', async () => {
        
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const saveMock = jest.fn().mockResolvedValue(true);
        var desktopRefreshTokenMock = { applicationType: 'desktop', invalidated: false, token: '' };
        var refreshTokens = [desktopRefreshTokenMock];
        const userMock = { _id: 10, refreshTokens: refreshTokens, save: saveMock };
        
        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, userMock, null, null)
            });
            return innerPassportFunction;
        });

        userRepository.findOneById = jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => { resolve(userMock) })
        });

        //login just to get valid jwt whitch should be invalidated after logout
        let loginResponse = await userService.login('mobile', privateKey, req, res, next);
        await userService.logout(publicKey, loginResponse.refreshToken);

        //check if previous user's jwt's have been invalidated
        expect(desktopRefreshTokenMock.invalidated).toBe(false);
        //index 1 is new added refresh token in login function
        expect(refreshTokens[1].invalidated).toBe(true);

        //check if new refresh token has been stored, first in login function (add new refresh token to a database), second in
        //logout function (save invalidated flag)
        expect(saveMock).toBeCalledTimes(2);
    })
});

describe('Renew tokens function', () => {

    test('Renew - valid refresh token', async () => {

        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const date = new Date();
        const saveMock = jest.fn().mockResolvedValue(true);
        var mobileRefreshTokenMock = { applicationType: 'mobile', invalidated: false, token: '' };
        var desktopRefreshTokenMock = { applicationType: 'desktop', invalidated: false, token: '' };
        var refreshTokens = [mobileRefreshTokenMock, desktopRefreshTokenMock];
        const userMock = { _id: 10, refreshTokens: refreshTokens, save: saveMock };

        userRepository.findOneById = jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => { resolve(userMock) })
        });

        var innerPassportFunction;
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, userMock, null, null)
            });
            return innerPassportFunction;
        });


        process.env.accessTokenExpiresIn = 10 * 1000 * 60;
        process.env.refreshTokenExpiresIn = 11 * 1000 * 60;


        let loginResponse = await userService.login('mobile', privateKey, req, res, next);
        const refreshToken = loginResponse.refreshToken;
        const newTokens = await userService.renew(privateKey, publicKey, refreshToken);
        const decodedRefreshToken = decode(newTokens.refreshToken);

        //check jwts
        expect(decodedRefreshToken.type).toBe('refresh');
        expect(Number(decodedRefreshToken.sub)).toBe(10);
        expect(new Date(decodedRefreshToken.exp * 1000).getTime()).toBeLessThan(new Date().getTime() + 1000 * 60 * 11);
        expect(new Date(decodedRefreshToken.exp * 1000).getTime()).toBeGreaterThan(date.getTime() + 1000 * 60 * 10);

        const decodedAccessToken = decode(newTokens.accessToken);
        expect(decodedAccessToken.type).toBe('access');
        expect(Number(decodedAccessToken.sub)).toBe(10);
        expect(new Date(decodedAccessToken.exp * 1000).getTime()).toBeLessThan(new Date().getTime() + 1000 * 60 * 10);
        expect(new Date(decodedAccessToken.exp * 1000).getTime()).toBeGreaterThan(date.getTime() + 1000 * 60 * 9);

        //check if previous user's jwt's have been invalidated
        expect(mobileRefreshTokenMock.invalidated).toBe(true);
        expect(desktopRefreshTokenMock.invalidated).toBe(false);
        //index 2 is token added in login function
        expect(refreshTokens[2].invalidated).toBe(true);
        //index 3 is token added in renew funcion
        expect(refreshTokens[3].invalidated).toBe(false);

        //check if new refresh token has been stored
        expect(refreshTokens[3].applicationType).toBe('mobile');
        expect(saveMock).toBeCalledTimes(2);
    })

    test('Renew - invalid refresh token passed', async () => {
        const newTokens = userService.renew(privateKey, publicKey, '');

        expect(newTokens).rejects.toThrow();
    });

    test('Renew - expired token passed', async () => {
        const newTokens = userService.renew(privateKey, publicKey, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY2NjgwMjcyOSwiZXhwIjoxNjY2ODAyMDY5LCJzdWIiOiIxMCJ9.060hXWdxYFKOLb-0A6BW-VRPoUQm6e5nVB4YG9a2C22tCkBarXsC_UQuGUFWG4gmAxOxC7nkitPlTfoQMuHGp-3MmpXcHtsksQ07J3WCOQ7WDP6M55v1glpGPBVPI2sZxAzZ1N8gBg72mFLr47tHXoo_DhyHmSMJ3Ms36v71T_g');

        expect(newTokens).rejects.toThrow('jwt expired');
    });

    test('Renew - access token passed instead of refresh token', async () => {
        const req = jest.fn();
        const res = jest.fn();
        const next = jest.fn();
        const date = new Date();
        const saveMock = jest.fn().mockResolvedValue(true);
        var mobileRefreshTokenMock = { applicationType: 'mobile', invalidated: false, token: '' };
        var desktopRefreshTokenMock = { applicationType: 'desktop', invalidated: false, token: '' };
        var refreshTokens = [mobileRefreshTokenMock, desktopRefreshTokenMock];
        const userMock = { _id: 10, refreshTokens: refreshTokens, save: saveMock };
        userRepository.findOneById = jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => { resolve(userMock) })
        });
        passport.authenticate = jest.fn().mockImplementation((type, callback) => {
            var innerPassportFunction = jest.fn().mockImplementation((req, res, next) => {
                callback(null, userMock, null, null)
            });
            return innerPassportFunction;
        });
        process.env.accessTokenExpiresIn = 10 * 1000 * 60;
        process.env.refreshTokenExpiresIn = 11 * 1000 * 60;


        let loginResponse = await userService.login('mobile', privateKey, req, res, next);
        const accessToken = loginResponse.accessToken;
        const newTokens = userService.renew(privateKey, publicKey, accessToken);

        expect(newTokens).rejects.toThrow('not valid refresh token');
    });

});