const mongoose = require('mongoose');
const validator = require('validator');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50,
        lowercase: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100,
        lowercase: true
    },
    emailId: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email address: ' + value);
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value >= 18;
            },
            message: 'You must be more than 18 years for signing up. Thank you for your interest in TechMate'
        }
    },
    gender: {
        type: String,
        validate: {
            validator: function (value) {
                const genders = ['Male', 'Female', 'Others'];
                return genders.some(item => item.includes(value));
            },
            message: 'Please choose a gender as Male, Female or Others.'
        }
    },
    about: {
        type: String,
        maxLength: 500
    },
    photoURL: {
        type: String,
        default: "https://isobarscience-1bfd8.kxcdn.com/wp-content/uploads/2020/09/default-profile-picture1.jpg",
        validate: {
            validator: function (value) {
                if (!validator.isURL(value)) {
                    throw new Error('Invalid URL, please try again!');
                }
            }
        }
    },
    skills: [String]
}, { timestamps: true });

// userSchema.pre('save', function(next){
//     this.firstName= this.firstName.toUpperCase();
//     next();
// });

userSchema.pre('save', function (next) {
    const validNameRegex = /^[a-zA-Z\s'-]+$/;
    if (!validNameRegex.test(this.firstName) || !validNameRegex.test(this.lastName)) {
        next(new Error('Invalid characters in name. Please try again!'));
    }
    next();
});
// userSchema.pre('save', function (next) {
//     if (!this.emailId.includes('@')) {
//         next(new Error('Invalid email address!'));
//     }
//     next();
// });

userSchema.pre('save', function (next) {
    if (this.skills.length > 10) {
        throw next(new Error('Cannot add more than 10 skills'));
    }
    next();
});

userSchema.methods.getJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user._id }, process.env.PRIVATE_KEY, { expiresIn: '7d' });
    return token;
}

userSchema.methods.validatePassword = async function (passwordEntered){
    const user = this;
    const savedPassword = user.password;
    const isPasswordMatch = await bcrypt.compare(passwordEntered, savedPassword);
    return isPasswordMatch;
}

module.exports = mongoose.model("User", userSchema);