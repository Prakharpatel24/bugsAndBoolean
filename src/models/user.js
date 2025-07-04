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
        lowercase: true,
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
        // required: true
    },
    age: {
        type: Number,
        default: null,
        set: function (value) {
            if(value === "null" || value === '' || value=== null) return null;
            const n = Number(value);
            if(Number.isNaN(n)) throw new Error('Age must be numeric');
            return n;
        }
        // required: true,
        // validate: {
        //     validator: function (value) {
        //         return value >= 18;
        //     },
        //     message: 'You must be more than 18 years for signing up. Thank you for your interest in TechMate'
        // }
    },
    gender: {
        type: String,
        default: '',
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
        default: '',
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
    skills: [String],
    githubUsername: {
        type: String,
        default: '',
        match: /^(?!-)(?!.*--)[a-zA-Z0-9-]{1,39}(?<!-)$/,
        lowercase: true,
        trim: true
    },
    instagramUsername: {
        type: String,
        default: '',
        match: /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/,
        lowercase: true,
        trim: true
    },
    linkedInUsername: {
        type: String,
        default: '',
        match: /^[a-zA-Z0-9-]{3,100}$/,
        lowercase: true,
        trim: true
    },
    xUsername: {
        type: String,
        default: '',
        match: /^[A-Za-z0-9_]{1,15}$/,
        lowercase: true,
        trim: true
    },
}, { timestamps: true });

// userSchema.pre('save', function(next){
//     this.firstName= this.firstName.toUpperCase();
//     next();
// });

userSchema.pre('save', function (next) {
    const validNameRegex = /^[a-zA-Z\s'-]+$/;
    if (!validNameRegex.test(this.firstName) || !validNameRegex.test(this.lastName)) {
        return next(new Error('Invalid characters in name. Please try again!'));
    }
    return next();
});
// userSchema.pre('save', function (next) {
//     if (!this.emailId.includes('@')) {
//         next(new Error('Invalid email address!'));
//     }
//     next();
// });

userSchema.pre('save', function (next) {
    if (this.skills.length > 10) {
        return next(new Error('Cannot add more than 10 skills'));
    }
    return next();
});

userSchema.methods.getJWT = async function () {
    const user = this;
    const token = await jwt.sign({ _id: user._id }, process.env.PRIVATE_KEY, { expiresIn: '7d' });
    return token;
}

userSchema.methods.validatePassword = async function (passwordEntered) {
    const user = this;
    const savedPassword = user.password;
    const isPasswordMatch = await bcrypt.compare(passwordEntered, savedPassword);
    return isPasswordMatch;
}

module.exports = mongoose.model("User", userSchema);