const mongoose = require('mongoose');
// User Schema Or Document Structure

const projectSchema = mongoose.Schema({
    projectName: {
        type: String,
        required: true,
        unique: true,
    },
    ngoId: {
        type: String,
        required: true,
    },
    ngoName:{
        type : String
    },
    uploadDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    starRating:{
        type:Number,
        default:0,
    },
    vol: {
        type: [Object],
    },
    completeStatus: {
        type: Boolean,
        default: false,
    },
    serviceCategory: {
        type:String
    },
    projectCover:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    }

})

//Create Model
const Projects = new mongoose.model("PROJECT", projectSchema);
module.exports = Projects;