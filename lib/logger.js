const winston = require('winston');
require('winston-mongodb');

var loggerObj;

module.exports = {
    /**
     * Creates winston logger object
     * @param {*} loggerOptions winston logger options
     * @param {*} mongoDbURI MongoDB connection uri
     * @param {*} mongoTransportOptions winston-mongodb options
     */
    async initLogger(loggerOptions, mongoDbURI, mongoTransportOptions){
        mongoTransportOptions = mongoTransportOptions ? mongoTransportOptions : {};
        Object.assign(mongoTransportOptions, {db: mongoDbURI});
        loggerObj = await winston.createLogger(loggerOptions ? loggerOptions : {}); 
        console.log(mongoDbURI)
        if(mongoDbURI)
            await loggerObj.add(new winston.transports.MongoDB(mongoTransportOptions));
    },
    get logger(){
        if(!loggerObj)
            throw new Error('logger is not initialized')
        return loggerObj;
    }
}