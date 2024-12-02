const validator = require('validator');

const checkForStrongPassword = (password) => {
    return validator.isStrongPassword(password);
}

module.exports ={checkForStrongPassword};