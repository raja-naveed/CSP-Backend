const mongoose = require('mongoose');

// User Schema Or Document Structure
const rewardSchema = mongoose.Schema({
    volId : {
        type : String,
        required: true
    },
    certificateRequest:{
        type:Boolean
    },
    pointRequest:{
        type:Boolean,
    },
    projectId:{
        type :String,
        default:""
    },
    certificate:{
        type:String,
        default:""
    },
    points :{
        type:Number,
        default:0
    },
    ngoId:{
        type:String
    }
})
//Create Model
const Rewards = new mongoose.model("REWARD", rewardSchema);
module.exports = Rewards;
