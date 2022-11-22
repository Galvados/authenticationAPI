# Simple error handler for express application. 
Express middleware - error handler. Allows to create custom errors containing http status appropriate to the type of error. Contains errors list class for request body validation purposes.

Examples: 

```js
const errorHandler = require('./middleware');
const ErrorsList = require('./errorsList');
const BasicError = require('./basicError');
const app = express();

app.use(errorHandler);


app.get('/errorsList', function createError(req,
    res, next) {
  var err = new ErrorsList('Username invalid', 'Password invalid');
  err.add('Document not found');
  next(err);
});
/*
    Response Body: Username invalid. Password invalid. Document not found
    Response status: 400
*/

app.get('/basicError', function createError(req,
    res, next) {
  var err = new BasicError('System error', 500);
  next(err);
});
/*
    Response Body: System error
    Response status: 500
*/

app.listen(process.env.PORT);



```