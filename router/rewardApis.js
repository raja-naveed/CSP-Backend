const cookieParser = require("cookie-parser");
const express = require("express");
const rewardApis = express.Router();
const reward = express();
const multer = require("multer");
const path = require("path");
const Rewards = require("../models/RewardSchema");
const Projects = require("../models/projectSchema");
const Users = require("../models/volunteerSchema");
const { default: mongoose } = require("mongoose");
const Ngos = require("../models/ngoSchema");
const Admin = require("../models/adminSchema");
const { BASEURL } = require("../urls");

rewardApis.use(express.json());
rewardApis.use(express.urlencoded({ extended: true }));
rewardApis.use(cookieParser());

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
        fileSize: 2048570006, // 1 MB in bytes
    },
});
reward.use("/profile", express.static("upload/images/ngoProfile"));

rewardApis.post("/request", async (req, res) => {
    try {
        const { projectId, volId, certificateRequest, pointRequest, ngoId } = req.body;
        const checkForSingleRequest = await Rewards.find({ projectId: projectId, volId: volId });
        if (checkForSingleRequest && checkForSingleRequest.length > 0) {
            const success = await Rewards.findOneAndUpdate({ projectId: projectId, volId: volId, ngoId: ngoId }, req.body, { new: true })
            if (success) {
                res.status(200).send("Success");
            }
            else {
                res.status(400).send("Bad Request");
            }
        }
        else {
            const createReward = new Rewards(req.body);
            const success = createReward.save();
            if (success) {
                res.status(200).send("Success");
            }
            else {
                res.status(400).send("Bad Request");
            }
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

rewardApis.post("/certificateRequest", async (req, res) => {
    try {
        let { ngoId } = req.body;
        const requests = await Rewards.find({ certificateRequest: true, ngoId: ngoId, certificate: "" });
        const project = await Projects.find({ isActive: true });
        const volunteer = await Users.find({ isActive: true });

        let data = [];
        if (requests) {
            requests.forEach((e) => {
                let filterVol = [];
                let filterProject = [];
                if (project) {
                    let projectId = mongoose.Types.ObjectId(e.projectId);
                    filterProject = project.filter((q) => q._id.equals(projectId));
                }
                if (volunteer && volunteer.length > 0) {
                    let volId = mongoose.Types.ObjectId(e.volId);
                    filterVol = volunteer.filter((p) => p._id.equals(volId));
                }

                if (filterProject && filterProject.length > 0 && filterVol && filterVol.length > 0) {
                    data.push({
                        projectId: filterProject[0]._id,
                        projectName: filterProject[0].projectName,
                        volId: filterVol[0]._id,
                        volName: filterVol[0].fullname,
                        volDp: filterVol[0].profileImage,
                        rewardId: e._id
                    });
                }
            });
        }
        if (data && data.length > 0) {
            res.status(200).send(data);
        }
       
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

rewardApis.get("/pointsRequest", async (req, res) => {
    try {
        const requests = await Rewards.find({ pointRequest: true, points: 0 });
        const project = await Projects.find({ isActive: true });
        const volunteer = await Users.find({ isActive: true });
        const ngo = await Ngos.find({ isActive: true });
        const admins = await Admin.find({});

        let data = [];
        if (requests) {
            requests.forEach((e) => {
                let filterVol = [];
                let filterProject = [];
                let filterNgo = [];
                if (project) {
                    let projectId = mongoose.Types.ObjectId(e.projectId);
                    filterProject = project.filter((q) => q._id.equals(projectId));
                    console.log("filterProject", filterProject);
                }
                if (volunteer && volunteer.length > 0) {
                    let volId = mongoose.Types.ObjectId(e.volId);
                    filterVol = volunteer.filter((p) => p._id.equals(volId));
                }
                console.log("filterVol", filterVol);
                if (ngo && ngo.length > 0) {
                    let ngoId = mongoose.Types.ObjectId(e.ngoId);
                    filterNgo = ngo.filter((p) => p._id.equals(ngoId));
                }
                if (!filterNgo || !filterNgo.length > 0) {
                    let adminId = mongoose.Types.ObjectId(e.ngoId);
                    filterNgo = admins.filter((l) => l._id.equals(adminId));
                }
                console.log("filterNgo", filterNgo);
                if (filterProject && filterProject.length > 0 && filterVol && filterVol.length > 0 && filterNgo && filterNgo.length > 0) {
                    data.push({
                        projectId: filterProject[0]._id,
                        projectName: filterProject[0].projectName,
                        ngoName: filterNgo[0].ngoName ? filterNgo[0].ngoName : "admin",
                        volId: filterVol[0]._id,
                        volName: filterVol[0].fullname,
                        volDp: filterVol[0].profileImage,
                        rewardId: e._id
                    });
                }
            });
        }
        if (data && data.length > 0) {
            res.status(200).send(data);
        }
        else {
            res.status(404).send("Not Found")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

rewardApis.put("/uploadCertificate", upload.single("certificate"), async (req, res) => {
    try {
        let rewardId = mongoose.Types.ObjectId(req.body.rewardId);
        const certificate = `${BASEURL}profile/${req.file.filename}`;
        const reward = await Rewards.findByIdAndUpdate({ _id: rewardId }, { certificate: certificate }, { new: true });
        if (reward) {
            res.status(200).send("Updated")
        }
        else {
            res.status(400).send("Bad Request")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

rewardApis.post("/rejectRequest", async (req, res) => {
    try {
        let { rewardId, projectId, volId } = req.body;
        let rewardid = mongoose.Types.ObjectId(rewardId);
        const request = await Rewards.findByIdAndDelete(rewardid);
        console.log(request);
        if (request) {
            let proId = mongoose.Types.ObjectId(projectId);
            const project = await Projects.findByIdAndUpdate({ _id: proId }, { $set: { "vol.$[elem].status": false } }, { arrayFilters: [{ "elem.id": volId }] })
            if (project) {
                res.status(200).send("Project updated");
            }
            else {
                res.status(400).send("Bad Request");
            }
        }
        else {
            res.status(400).send("Error Deleting request")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

rewardApis.put("/grant/:id", async (req, res) => {
    try {
        let { points } = req.body;
        let id = req.params.id;
        const reward = await Rewards.findOneAndUpdate({ _id: id }, { $inc: { points: points } }, { new: true });
        if (reward) {
            res.status(200).send(reward);
        }
        else {
            res.status(400).send("error")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

rewardApis.post("/getCertificate", async (req, res) => {
    try {
        let { volId } = req.body;
        const requests = await Rewards.find({ certificateRequest: true, volId: volId  });
        const project = await Projects.find({ vol: { $elemMatch: { id: volId, status: true } } });
        let data = [];
        if (requests && project) {
            project.forEach((element) => {
                let filterData = requests.filter((e) => {
                    return mongoose.Types.ObjectId(e.projectId).equals(element._id) && e.certificate !== "" && e.ngoId === element.ngoId;
                });
                if (filterData && filterData.length > 0) {
                    data.push({
                        projectName: element.projectName,
                        serviceCategory: element.serviceCategory,
                        uploadDate: element.uploadDate,
                        endDate: element.endDate,
                        certificate: filterData[0].certificate
                    })
                }
            })
        }
        if (data && data.length > 0) {
            res.status(200).send(data);
        }
        else {
            res.status(404).send("Not Found")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = rewardApis;