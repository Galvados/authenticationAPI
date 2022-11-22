"use strict";

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const logger = require('./lib/logger');
const winston = require('winston');
const app = express();

async function init() {

  //bodyparser
  app.use(express.json());


  //init logger 
  await logger.initLogger({
    level: "error", format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${message} - ${stack}`;
      }),
      winston.format.metadata()
    ),
    transports: [new winston.transports.Console({
      format: winston.format.simple(),
    })]
  }, process.env.mongoLoggerConnectionURL, { 'level': 'error' });

  //passport
  passport.use(require('./middlewares/passportLocalStrategy').strategy);
  app.use(passport.initialize());

  //database connection
  await mongoose.connect(process.env.mongoConnectionURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Successfully connected to MongoDB"))
    .catch(err => console.log(err));

  //initialize all routes 
  app.use('/auth', require('./routes/authentication'));
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
  );


  //set custom error handler
  app.use(require('./lib/errorHandler/middleware'));

  //start server
  app.listen(process.env.port, console.log(`Server running on PORT ${process.env.port}`));
}
init();
