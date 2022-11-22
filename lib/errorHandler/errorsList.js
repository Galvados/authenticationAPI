const BasicError = require('./basicError');

module.exports = class ValidationErrorsList extends BasicError {
    
    constructor(...messages) {
        super('Errors list', 400);
        this.errorsList = [];
        for (let index = 0; index < messages.length; index++) {
            const message = messages[index];
            this.errorsList.push(new BasicError(message, this.status));
        }

        //it has to be like that because message getter doesn't override Error class message for some reason
        this.message = this.messageGetter;
    }

    get messageGetter() {
        let response = [];
        for (let index = 0; index < this.errorsList.length; index++) {
            const element = this.errorsList[index];
            response.push(element.message);
        }
        return response.join('. ');
    }

    add(message) {
        this.errorsList.push(new BasicError(message, this.status));
        //it has to be like that because message getter doesn't override Error class message for some reason
        this.message = this.messageGetter;
    }

}