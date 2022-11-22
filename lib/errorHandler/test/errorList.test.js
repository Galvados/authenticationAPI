const ErrorsList = require('../errorsList');

test('error list message formatting', () => {
    try {
        throw new ErrorsList('test1', 'test2');       
    } catch (error) {
        expect(error.message).toBe('test1. test2');
    }
    
});

test('add error to error list', () => {
    try {
        const errorList = new ErrorsList('test1', 'test2');     
        errorList.add('test3');  
        throw errorList;
    } catch (error) {
        expect(error.message).toBe('test1. test2. test3');
    }
    
});

test('error status property', () => {
    try {
        throw new ErrorsList('test1');       
    } catch (error) {
        expect(error.status).toBe(400);
    }
    
});