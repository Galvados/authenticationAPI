
const UserModel = require("../models/user");

module.exports = {
    findOneByEmail: function(email){
        return UserModel.findOne({
            email: email,
        });
    },

    findOneById: function(id){
        return UserModel.findOne({
            _id: id
        })
    },
    
    createUser: function(params){
        const user = new UserModel(params);
        return user.save();
    }
}