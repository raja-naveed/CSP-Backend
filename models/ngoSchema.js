const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const { SECRET_KEY } = require("../urls");

// User Schema Or Document Structure

const ngoSchema = mongoose.Schema({
    ngoName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    coverImage: {
        type: String,
        default:null
    },
    profileImage: {
        type: String,
        default:null
    },
    certificate: {
        type: String,
        
    },
    description:{
        type:String,
    },
    address:{
        type : String
    },
    userType:{
        type:String,
        default : "ngo"
    },
    isActive:{
        type :Boolean,
        required:true
    },
    phone: {
        type: String,
        required: true,
    },
    bankingDetails: {
        account: String,
        accountnumber: String,
        branch: String,
        phone: String,
        title: String,
        iban:String,
        donations: [
            {
                amount: {
                    type: Number,
                    default:0,
                },
                id: {
                    type: String,
                }
            }
        ]
    },
    password: {
        type: String,
        required: true,
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
})
//Hashing password to Secure
ngoSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = bcryptjs.hashSync(this.password, 10);
    }
    next();
})

//Generate Tokens to verify user
ngoSchema.methods.generateToken = async function () {
    try {
        let generatedToken = jwt.sign({ _id: this.id }, SECRET_KEY);
        this.tokens = this.tokens.concat({ token: generatedToken });
        await this.save();
        return generatedToken;
    }
    catch (error) {
        console.log(error);
    }
}

//Create Model
const Ngos = new mongoose.model("NGO", ngoSchema);
module.exports = Ngos;
