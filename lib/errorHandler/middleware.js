const BasicError = require('./basicError');
const logger = require('../logger').logger;

module.exports = function clientErrorHandler (err, req, res, next) {
    if (err instanceof BasicError) {
      res.status(err.status).send({"description": err.message});
    } else {
      logger.error(err);
      res.status(500).send({"description": 'internal server error'});
    }
  }