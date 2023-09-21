const cookieParser = require('cookie-parser');
const express = require('express');
const Admin = require('../models/adminSchema');
const admin = express();
const Ngos = require('../models/ngoSchema');
const Projects = require('../models/projectSchema');
const Users = require('../models/volunteerSchema');
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const path = require('path');
const { send } = require('process');
const adminApis = express.Router();
const { BASEURL } = require("../urls");

adminApis.use(express.json());
adminApis.use(express.urlencoded({ extended: true }));
adminApis.use(cookieParser());

//Login Admin
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
        fileSize: 2048500076, // 1 MB in bytes
    },
});
admin.use("/profile", express.static("upload/images/ngoProfile"));
adminApis.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        //Find User if exist
        const user = await Admin.findOne({ email: email });
        if (user) {
            //Verify password

            if (password === user.password) {
                const token = await user.generateToken();
                console.log(token);
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
        res.status(400).send(error)
    }
});

adminApis.get("/inActiveNgo", async (req, res) => {
    try {
        const ngo = await Ngos.find({ isActive: false });
        if (ngo) {
            res.status(200).send(ngo);
        }
        else {
            res.status(404).send("Not Found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.get("/inActiveVolunteer", async (req, res) => {
    try {
        const ngo = await Users.find({ isActive: false });
        if (ngo) {
            res.status(200).send(ngo);
        }
        else {
            res.status(404).send("Not Found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
})

adminApis.get("/inActiveProjects", async (req, res) => {
    try {
        const ngo = await Projects.find({ isActive: false });
        if (ngo) {
            res.status(200).send(ngo);
        }
        else {
            res.status(404).send("Not Found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.get("/activeNgo", async (req, res) => {
    try {
        const ngo = await Ngos.find({ isActive: true });
        if (ngo) {
            res.status(200).send(ngo);
        }
        else {
            res.status(404).send("Not Found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.get("/activeVolunteer", async (req, res) => {
    try {
        const ngo = await Users.find({ isActive: true });
        if (ngo) {
            res.status(200).send(ngo);
        }
        else {
            res.status(404).send("Not Found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.delete("/deleteNgo/:id", async (req, res) => {
    const id = req.params.id;
    const ngoId = mongoose.Types.ObjectId(id);
    try {
        const ngo = await Ngos.findByIdAndDelete(ngoId);
        if (ngo) {
            res.status(200).send("Ngo deleted");
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.put("/updateNgo", async (req, res) => {
    try {
        let id = req.body._id;
        const ngo = await Ngos.findByIdAndUpdate({ _id: id }, { $set: req.body }, { new: true });
        if (ngo) {
            res.status(200).send("Ngo update");
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.delete("/deleteVolunteer/:id", async (req, res) => {
    const id = req.params.id;
    const volId = mongoose.Types.ObjectId(id);
    try {
        const ngo = await Users.findByIdAndDelete(volId);
        if (ngo) {
            res.status(200).send("volunteer deleted");
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.put("/updateVolunteer", async (req, res) => {
    try {
        let id = req.body._id;
        const vol = await Users.findByIdAndUpdate({ _id: id }, { $set: req.body }, { new: true });
        if (vol) {
            res.status(200).send("volunteer update");
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.get("/count", async (req, res) => {
    try {
        const ngo = await Ngos.find({ isActive: true });
        const vol = await Users.find({ isActive: true });
        const project = await Projects.find({ isActive: true });
        res.status(200).json({
            status: "success",
            data: {
                volunteers: vol.length,
                ngos: ngo.length,
                project: project.length
            }
        })
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.get("/latestRequests", async (req, res) => {
    try {
        const ngo = await Ngos.find({ isActive: false });
        const vol = await Users.find({ isActive: false });
        const project = await Projects.find({ isActive: false });
        let data = [];
        if (ngo && ngo.length > 0) {
            ngo.forEach(e => {
                data.push({
                    ngoName: e.ngoName,
                    ngoId: e._id
                })
            })
        }
        if (vol && vol.length > 0) {
            vol.forEach(e => {
                data.push({
                    volName: e.fullname,
                    volId: e._id
                })
            })
        }
        if (project && project.length > 0) {
            project.forEach(e => {
                data.push({
                    projectName: e.projectName,
                    projectId: e._id
                })
            })
        }
        if (data && data.length > 0) {
            res.status(200).json({
                status: "success",
                data: data,
                count: data.length
            })
        }
        else {
            res.status(404).send("Not Found")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.put("/disableUser", async (req, res) => {
    try {
        let id = req.body._id;
        let update = await Users.findByIdAndUpdate({ _id: id }, { $set: req.body }, { new: true });
        if (!update) {
            update = await Ngos.findByIdAndUpdate({ _id: id }, { $set: req.body }, { new: true });
        }
        if (update) {
            res.status(200).send("Updated");
        }
        else {
            res.status(404).send("Not Found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.get("/about", async (req, res) => {
    try {
        const about = await Admin.find({});
        if (about) {
            res.status(200).send(about);
        }
        else {
            res.status(404).send("No about found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.put("/updateCategory", async (req, res) => {
    try {
      const { category } = req.body;
      const update = await Admin.findOneAndUpdate(
        { email: "admin" },
        { $push: { serviceCategory: category } },
        { upsert: true }
      );s
      if (update) {
        res.status(200).send(update);
      } else {
        res.status(400).send("Bad Request");
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  

adminApis.post("/deleteCategory", async (req, res) => {
    try {
        const { category } = req.body
        const update = await Admin.findOneAndUpdate({ email: "admin" }, { $pull: { serviceCategory: category } }, { upsert: true });
        if (update) {
            res.status(200).send(update);
        }
        else {
            res.status(404).send("No about found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.put("/updateMission", upload.single("image"), async (req, res) => {
    try {
        const { mission, description } = req.body;
        const image = `${BASEURL}profile/${req.file.filename}`;
        const update = await Admin.findOneAndUpdate({ email: "admin" }, { image: image, mission: mission, description: description }, { new: true });
        if (update) {
            res.status(200).send("Updated")
        }
        else {
            res.status(400).send("Bad Request")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

adminApis.post("/sliderImages",upload.array("file"),async(req,res)=>{
    try {
        const layout= [];
        if(req.files){
            req.files.map((e)=>{
                layout.push(`${BASEURL}profile/${e.filename}`)
            })
            const updateSlider = await Admin.findOneAndUpdate({email:"admin"},{$set:{layout:layout}},{new:true});
            if(updateSlider)
            {
                res.status(200).json({
                    status:"success",
                    data:updateSlider,
                    count :updateSlider ? updateSlider.length : 0
                })
            }
        }

        else{
            res.status(400).send("No files Found");
        }
        
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
})

adminApis.get("/getSlider",async(req,res)=>{
    try {
        const response = await Admin.find({email:"admin"});
        if(response){
            res.status(200).json({
                success : "true",
                data: response[0] &&  response[0].layout ? response[0].layout : [], 
            })
        }
        else{
            res.status(404).send("Not found")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });;
    }
});

module.exports = adminApis;