const express = require("express");
const ngo = express();
const ngoApis = express.Router();
const Ngos = require("../models/ngoSchema");
const multer = require("multer");
const path = require("path");
const Joi = require("joi");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const Projects = require("../models/projectSchema");
const Users = require("../models/volunteerSchema");
const Admin = require("../models/adminSchema");
const { BASEURL } = require("../urls");

//Methods to get data from frontend
ngoApis.use(express.json());
ngoApis.use(express.urlencoded({ extended: true }));
ngoApis.use(cookieParser());

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
    fileSize: 52428800,//50mb
  },
});
ngo.use("/profile", express.static("upload/images/ngoProfile"));
//NgoRegistration
ngoApis.post("/register", upload.single("certificate"), async (req, res) => {
  try {
    const {
      ngoName,
      email,
      phone,
      password,
      confirmpassword,
      address,
      description,
      isActive
    } = req.body;
    const certificate = `${BASEURL}profile/${req.file.filename}`;
    const createUser = new Ngos({
      ngoName: ngoName,
      email: email,
      password: password,
      phone: phone,
      address: address,
      confirmpassword: confirmpassword,
      certificate: certificate ? certificate : "",
      description: description,
      isActive: isActive
    });
    //Saving the created user...
    const created = await createUser.save();
    res.status(200).send("NGO Registered");
  } catch (error) {
    res.status(400).json({data:[],message:error.message});
  }
});

// Get Ngos
ngoApis.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    //Find User if exist
    const user = await Ngos.findOne({ email: email, isActive: true });
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

ngoApis.put("/updateNgo/:id", upload.fields([{
  name: 'coverImage', maxCount: 1
}, {
  name: 'profileImage', maxCount: 1
}, {
  name: 'certificate', maxCount: 1
}]), async (req, res) => {
  try {
    let responce = false
    if (req.files) {
      let updateObj = {};
      if (req.files.coverImage) {
        updateObj.coverImage = `${BASEURL}profile/${req.files.coverImage[0].filename}`;
      }
      if (req.files.profileImage) {
        updateObj.profileImage = `${BASEURL}profile/${req.files.profileImage[0].filename}`;
      }
      if (req.files.certificate) {
        updateObj.certificate = `${BASEURL}profile/${req.files.certificate[0].filename}`;
      }
      const files = await Ngos.findByIdAndUpdate({ _id: req.params.id }, { $set: updateObj }, { new: true });
      const body = await Ngos.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
      files && body ? responce = true : responce = false;
    } else if (req.body) {
      ngo = await Ngos.findByIdAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true });
      responce = true;
    }
    if (responce) {
      const updatedNgo = await Ngos.findById(req.params.id);
      res.status(200).send(updatedNgo);
      console.log("Ngo Updated")
    } else {
      res.status(404).send("Ngo Not Found");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

ngoApis.put('/bankdetails/:id', (req, res) => {
  Ngos.findOneAndUpdate({ _id: req.params.id }, {
    $set: {
      "bankingDetails.account": req.body.account || undefined,
      "bankingDetails.accountnumber": req.body.accountnumber || undefined,
      "bankingDetails.branch": req.body.branch || undefined,
      "bankingDetails.phone": req.body.phone || undefined,
      "bankingDetails.title": req.body.title || undefined,
      "bankingDetails.iban": req.body.iban || undefined
    }
  }, { new: true })
    .then(result => {
      res.send(result)
    })
    .catch(error => console.error(error))
})

ngoApis.post("/getById/:id", async (req, res) => {
  try {
    let id = req.params.id;
    const ngo = await Ngos.find({ _id: id });
    if (ngo) {
      res.status(200).send(ngo);
      console.log("NGO Found");
    }
    else {
      res.status(404).send("No Ngo Found");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
})

ngoApis.get("/getAll", async (req, res) => {
  try {
    const project = await Ngos.find({ isActive: true });
    if (project && project.length) {
      res.status(200).send(project);
      console.log("projects Found");
    } else {
      res.status(404).send("No Projects Found");
    }

  }
  catch (error) {
    res.status(400).json({ error: error.message });;
  }
});

ngoApis.put("/amountDonate/:id", async (req, res) => {
  try {
    let { amount } = req.body;
    let id = req.params.id;
    const newDonation = {
      amount
    };
    const donation = await Ngos.findOneAndUpdate({ _id: id }, { $push: { "bankingDetails.donations": newDonation } }, { new: true });
    if (donation) {
      res.status(200).send(donation);
    }
    else {
      res.status(404).send("error")
    }
  } catch (error) {
    res.status(400).json({ error: error.message });;
  }
});

ngoApis.post("/getVolNgoProjects", async (req, res) => {
  try {
    let {id} = req.body;
    const project = await Projects.find({ ngoId: id, isActive: true });
    if (project && project.length > 0) {
      const volunteers = await Users.find({isActive : true});
      if (volunteers && volunteers.length > 0) {
        let vol = [];
        project.forEach((e) => {
          volunteers.forEach((p) => {
            let filteredVolunteer = e.vol.filter((q) => q.id === p._id)
            if (filteredVolunteer) {
              vol.push(p)
            }
          })
        })
        if (vol && vol.length > 0) {
          vol = vol.filter((ele , index)=> index === vol.findIndex(elem => elem._id === ele._id))
          res.status(200).send(vol);
        }
        else {
          res.status(404).send("No filtered vol")
        }
      }
      else{
        res.status(404).send("No Volunteers found.")
      }
    } 
  }
  catch (error) {
    res.status(400).json({ error: error.message });;
  }
});

ngoApis.get("/serviceCategory" , async(req , res)=>{
  try {
      const serviceCategory  = await Admin.find({});
      if(serviceCategory){
          res.status(200).json({
              success : "true",
              data : serviceCategory[0].serviceCategory,
          });
      }
      else{
          res.status(404).send("No service found");
      }
  } catch (error) {
      res.status(400).json({ error: error.message });;
  }
});
module.exports = ngoApis;