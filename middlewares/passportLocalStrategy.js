const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const UserRepository = require("../repositories/user");

//Add's middleware to given passport object which validates user using "email" and "password" fields passed in request
module.exports = {
    strategy: new LocalStrategy({ usernameField: "email", passwordField: 'password' }, (email, password, done) => {
        //find user with given email
        UserRepository.findOneByEmail(email).then((user) => {
            if (!user) {
                return done(null, false, {
                    message: "Incorrect username or password"
                });
            }

            //check if password is correct
            bcrypt.compare(password, user.password, (err, isCorrect) => {
                if (err) throw err;
                if (isCorrect) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: "Incorrect username or password",
                    });
                }
            });
        });
    })
}