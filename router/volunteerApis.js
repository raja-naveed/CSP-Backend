const express = require('express');
const volunteer = express();
const volunteerApis = express.Router();
const Users = require("../models/volunteerSchema");
const multer = require("multer");
const path = require("path");
const bcryptjs = require('bcryptjs');
const cookieParser = require('cookie-parser');
const Rewards = require('../models/RewardSchema');
const { BASEURL } = require("../urls");

//Methods to get data from frontend
volunteerApis.use(express.json());
volunteerApis.use(express.urlencoded({ extended: true }));
volunteerApis.use(cookieParser());

const storage = multer.diskStorage({
    destination: "./upload/images/ngoProfile",
    filename: (req, file, cb) => {
        return cb(
            null,
            `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1048000057, // 1 MB in bytes
    },
});
volunteer.use("/profile", express.static("upload/images/ngoProfile"));
//NgoRegistration
volunteerApis.post("/register", async (req, res) => {
    try {
        // Get body
        const {
            fullname,
            email,
            phone,
            password,
            confirmpassword,
            address,
            cnic,
            institution,
            isActive,
            enrollment
        } = req.body;

        const createUser = new Users({
            fullname: fullname,
            email: email,
            password: password,
            phone: phone,
            address: address,
            confirmpassword: confirmpassword,
            cnic: cnic,
            institution: institution,
            enrollment:enrollment,
            isActive:isActive
        });
        //Saving the created user...
        const created = await createUser.save();
        console.log(created);
        res.status(200).send("User Registered");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get Ngos
volunteerApis.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        //Find User if exist
        const user = await Users.findOne({ email: email ,isActive :true});
        if (user) {
            //Verify password
            const isMatch = await bcryptjs.compare(password, user.password);

            if (isMatch) {
                const token = await user.generateToken();
                res.cookie("jwt", token, {
                    expires: new Date(Date.now() + 86400000),
                    httpOnly: true
                })
                res.status(200).send("LoggedIn");
                console.log("LoggedIn");
            } else {
                res.status(400).send("Invalid Credentials")
            }
        } else {
            res.status(400).send("Invalid Credentials");
        }
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
);

//Update volunteer
volunteerApis.put("/updateVolunteer/:id", upload.single('profileImage'), async (req, res) => {
    try {
        let volunteer = null;
        if (req.file) {
            const profileImage = `${BASEURL}profile/${req.file.filename}`;
            volunteer = await Users.findOneAndUpdate({ _id: req.params.id }, { ...req.body, profileImage: profileImage }, { upsert: true });
        }
        else {
            volunteer = await Users.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: true });
        }
        if (volunteer) {
            res.status(200).send(volunteer);
            console.log("Volunteer Updated")
        } else {
            res.status(404).json({ error: "Volunteer not found" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//collect points
volunteerApis.post("/collectPoints/:id" , async(req,res)=>{
    try {
        let id = req.params.id;
        const vol = await Rewards.find({volId : id});
        if(vol && vol.length > 0 ){
            let points = 0;
            vol.forEach(element=> {
                points += element.points;
            })
            res.status(200).json({
                status : "success",
                data : points
            })
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})
module.exports = volunteerApis;