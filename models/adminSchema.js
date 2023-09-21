const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../urls");

// Admin Schema Or Document Structure

const adminSchema = mongoose.Schema({
    email : {
        type : String,
        default:"admin",
        unique : true
    },
    password:{
        type:String,
        default:"complicated"
    },
    mission :{
        type:String,
        default:"Work for humanity"
    },
    description :{
        type:String,
        default:"Help peoples and other helping hands."
    },
    image : {
        type:String,
        default : ""
    },
    userType:{
        type:String,
        default : "admin"
    },
    serviceCategory :{
        type:[String],
        default :["Education"]
    },
    layout :{
        type:[String],
        default:[],
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
});
adminSchema.methods.generateToken = async function(){
    try{
    let generatedToken = jwt.sign({_id : this.id} , SECRET_KEY);
    this.tokens = this.tokens.concat({token : generatedToken});
    await this.save();
    return generatedToken;
    }
    catch(error){
        console.log(error);
    }
}
const Admin = new mongoose.model("ADMIN", adminSchema);
module.exports = Admin;