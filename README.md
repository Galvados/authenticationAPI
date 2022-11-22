# Authentication sample project

API that allows users to register and log in to the application. Its task is to store and generate tokens that can be verified by other services, using a public key. The project is to show my programming skills and coding style. In production projects, I recommend using known and well-tested solutions. Feel free to copy and modify the code. Feedback welcome.

## Details

The project is based on the well-known passport middleware. A solution for logging in using a login and password has been implemented, the code is in development and ready to add other types of logging (e.g. google).

The login function returns a refresh and an access token containing the user's id. Refresh tokens are stored in the mongodb database to allow them to be revoked. After expiration there is a method to refresh the tokens.

## Quick Start

docker-compose up

The fastest way is to use docker-compose. In the configuration file there is defined a container with the mongodb database and a container with the application. Two databases will be created. One for storing users, the other for logs. The winston package is used to handle logs.

Documentation with examples in the swagger by default is available at this address:
http://localhost:8080/api-docs/

