const BasicError = require('../basicError');

test('error status property', () => {
    try {
        throw new BasicError('test1', 400);       
    } catch (error) {
        expect(error.status).toBe(400);
    }
    
});