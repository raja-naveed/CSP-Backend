const Users = require("../models/volunteerSchema");
const Ngos = require("../models/ngoSchema");
const Admin = require("../models/adminSchema");
const jwt = require("jsonwebtoken")
const { SECRET_KEY } = require("../urls");

const authenticate = async (req,res,next)=>{
    try {
        const token =req.cookies.jwt;
        if(!token){
            res.status(401).send("No tokens");
        }
        else{
            let verifyToken = jwt.verify(token, SECRET_KEY);
            let rootUser = await Users.findOne({_id :verifyToken._id, "tokens.token":token})

            if(!rootUser){
                rootUser = await Admin.findOne({_id :verifyToken._id, "tokens.token":token})
            }
            if(!rootUser){
                rootUser = await Ngos.findOne({_id :verifyToken._id, "tokens.token":token})
            }
            if(!rootUser){
                res.status(401).send("User not Found");
            }
            else{
                res.status(200).send(rootUser);
            }
        }
        next(); 
    } catch (error) {
        res.status(401).send("error");
        console.log(error)
    }
}

module.exports =authenticate;