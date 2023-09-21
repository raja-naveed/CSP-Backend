const express = require('express');
const project = express();
const projectApis = express.Router();
const multer = require("multer");
const path = require("path");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Projects = require('../models/projectSchema');
const Users = require('../models/volunteerSchema');
const { default: mongoose } = require('mongoose');
const { BASEURL } = require("../urls");

//Methods to get data from frontend
projectApis.use(express.json());
projectApis.use(express.urlencoded({ extended: true }));
projectApis.use(cookieParser());

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
        fileSize: 104857600, // 1 MB in bytes
    },
});
project.use("/profile", express.static("upload/images/ngoProfile"));
//Create Project
projectApis.post("/create", upload.single('projectCover'), async (req, res) => {
    try {
        const {
            projectName,
            ngoId,
            ngoName,
            uploadDate,
            endDate,
            location,
            description,
            serviceCategory,
            isActive
        } = req.body;
        const projectCover = `${BASEURL}profile/${req.file.filename}`;

        const createproject = new Projects({
            projectName: projectName,
            ngoId: ngoId,
            uploadDate: uploadDate,
            description: description,
            endDate: endDate,
            projectCover: projectCover ? projectCover : null,
            location: location,
            serviceCategory: serviceCategory,
            isActive: isActive,
            ngoName: ngoName
        });
        //Saving the created project...
        const created = await createproject.save();
        console.log(created);
        res.status(200).send(created);
    } catch (error) {
        res.status(400).json({data:[],message:error.message});
    }
});

//get Project by Ngo Id
projectApis.post("/getByNgoId", async (req, res) => {
    try {
        const { ngoId } = req.body;
        let project = null;
        project = await Projects.find({ ngoId: ngoId, isActive: true });
        if (project) {
            res.status(200).send(project);
            console.log("projects Found")
        }
        else {
           // res.status(404).send("No project found");
        }
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//get Project by Ngo Id
projectApis.post("/getAllExcept", async (req, res) => {
    try {
        let id = req.body.id;
        const project = await Projects.find({ isActive: true, completeStatus: false });
        if (project && project.length > 0) {
            let volProjects = [];
            project.forEach((e) => {
                if (e.vol && id && e.vol.length > 0) {
                    let filteredProject = e.vol.filter((p) => { return p.id === id })
                    if (filteredProject && filteredProject.length > 0) {
                        return;
                    }
                    else {
                        volProjects.push(e);
                    }
                }
                else if (e.vol && e.vol.length === 0) {
                    volProjects.push(e)
                }
            })
            if (volProjects) {
                res.status(200).send(volProjects);
            }
            else {
                res.status(400).send("Bad request");
            }

        }
        else {
           // res.status(404).send("No projects Found")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.put("/addVol/:id", async (req, res) => {
    try {
        let id = req.params.id;
        const project = await Projects.findOneAndUpdate({ _id: id }, { $push: req.body }, { new: true });
        if (project) {
            res.status(200).send(project);
            console.log("volunteer  updated");
        }
        else {
            res.status(404).send("error");
        }
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
})

projectApis.post("/getByVol", async (req, res) => {
    try {
        let id = req.body.id;
        const projects = await Projects.find({ isActive: true, completeStatus: false })
        if (projects) {
            let volProjects = [];
            projects.forEach((project) => {
                let filteredProject = project.vol.filter((p) => { return p.id === id });
                console.log("filteredProject",filteredProject)
                if (filteredProject && filteredProject.length > 0 && filteredProject[0].status === true) {
                    volProjects.push({
                        id: project._id,
                        ngoId: project.ngoId,
                        serviceCategory: project.serviceCategory,
                        projectName: project.projectName,
                        location: project.location,
                        uploadDate: project.uploadDate,
                        endDate: project.endDate,
                        completed: true
                    });
                }
                else if(filteredProject && filteredProject.length > 0 && filteredProject[0].status === false){
                    volProjects.push({
                        id: project._id,
                        ngoId: project.ngoId,
                        serviceCategory: project.serviceCategory,
                        projectName: project.projectName,
                        location: project.location,
                        uploadDate: project.uploadDate,
                        endDate: project.endDate,
                        completed: false
                    });
                }
            })
            if (volProjects && volProjects.length > 0) {
                res.status(200).send(volProjects);
            } 
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


projectApis.delete("/deleteProject/:id", async (req, res) => {
    const id = req.params.id;
    const volId = mongoose.Types.ObjectId(id);
    try {
        const ngo = await Projects.findByIdAndDelete(volId);
        if (ngo) {
            res.status(200).send("project deleted");
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.put("/updateProject", async (req, res) => {
    try {
        let id = req.body._id;
        const project = await Projects.findByIdAndUpdate({ _id: id }, { $set: req.body }, { upsert: true });
        if (project) {
            res.status(200).send(project);
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.get("/getAll", async (req, res) => {
    try {
        const project = await Projects.find({ isActive: true });
        if (project) {
            res.status(200).send(project);
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.put("/done", async (req, res) => {
    try {
        let body = req.body;
        const _id = mongoose.Types.ObjectId(body.id);
        const project = await Projects.findByIdAndUpdate(
            _id,
            { $set: { "vol.$[elem].status": true } },
            { arrayFilters: [{ "elem.id": body.volId }] }
        );
        if (project) {
            res.status(200).send(project)
        }
        else {
            res.status(400).send("Bad Request");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.get("/getAllAfterNow", async (req, res) => {
    try {
        const project = await Projects.find({ isActive: true, completeStatus: false, endDate: { $gt: new Date } });
        if (project) {
            res.status(200).send(project);
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.post("/getAllVol", async (req, res) => {
    try {
        let id = req.body.id;
        let data = [];
        const project = await Projects.find({ _id: id, isActive: true })
        if (project && project[0].vol) {
            let volunteers = await Users.find({ isActive: true });
            console.log("volunteers", volunteers)
            project[0].vol.forEach((e) => {
                let vol = volunteers.filter(p => p._id.toString() === e.id);
                if (vol) {
                    vol.forEach(g => {
                        data.push(g);
                    })
                }
            });
            if (data && data.length > 0) {
                res.status(200).json({
                    success: true,
                    data: data,
                    count: data.length
                })
            }
            else {
                res.status(404).json({
                    success: false,
                    data: [],
                    count: 0
                })
            }
        }
        else {
            
          //  res.status(404).send("No projects Found")
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
})
projectApis.post("/rating", async (req, res) => {
    try {
        let _id = mongoose.Types.ObjectId(req.body.projectId);
        let starRating = req.body.starRating;
        const project = await Projects.findByIdAndUpdate(_id, { $set: { starRating: starRating } });
        if (project) {
            res.status(200).send("rating updated");
        }
        else {
            res.status(404).send("Not found");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

projectApis.post("/getRating", async (req, res) => {
    try {
        let _id = mongoose.Types.ObjectId(req.body.ngoId);
        const project = await Projects.find({ ngoId: _id });
        if (project  && project.length > 0) {
            let data = [];
            project.forEach((e) => {
                data.push({ projectId :e._id, starRating: e.starRating});
            })
            res.status(200).json({
                success: true,
                data: data,
                message: "rating fetched"
                })
            }
        else {
            res.status(404).json({
                success: false,
                data: [],
                message: "No projects Found"
            })
            }
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }});

module.exports = projectApis;