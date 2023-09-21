const dotenv = require('dotenv');
const express = require('express');
const adminRoute = require('./router/adminApis');
const ngoRoute = require('./router/ngoApis');
const volunteerRoute = require('./router/volunteerApis');
const projectRoute = require('./router/projectApis');
const rewardRoute =  require('./router/rewardApis');
const multer = require('multer');
const path = require('path');

const cors = require('cors');

// const { BASEURL } = require("./urls");

const storage = multer.diskStorage({
  destination: './upload/images/ngoProfile',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 204857600
  }
})
const cookieParser = require('cookie-parser');
const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001','http://alfawz.org'];

app.use(cors({
  // origin: function (origin, callback) {
  //   if (!origin) return callback(null, true);  // If no origin, always allow (could be a direct server request, Postman, etc.)
    
  //   if (allowedOrigins.indexOf(origin) === -1) {
  //     const errorMsg = 'The CORS policy for this site does not allow access from the specified origin.';
  //     return callback(new Error(errorMsg), false);
  //   }
  //   return callback(null, true);
  // },
  origin: true,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  credentials: true,
  methods: ["POST", "DELETE", "PUT", "GET", "OPTIONS"]
}));

require("./db/conn");

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3006");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept",
//   );
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header("Access-Control-Allow-Methods", "POST,DELETE, PUT , GET , OPTIONS")
//   next();
// });

const authenticate = require("./middleware/authenticate");
const Ngos = require('./models/ngoSchema');
const Users = require('./models/volunteerSchema');
const Projects = require('./models/projectSchema');
const Admin = require('./models/adminSchema');
const Rewards = require('./models/RewardSchema');
//using methods to get req and cookies from Frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/ngo', ngoRoute);
app.use('/volunteer', volunteerRoute);
app.use('/admin', adminRoute);
app.use('/project', projectRoute);
app.use('/reward', rewardRoute);
app.use('/profile', express.static('upload/images/ngoProfile'));


app.get("/", (req, res) => {
  res.json("Backend Connected.");
})
// app.delete("/deleteAll", async (req, res) => {
//   try {
//     const ngo = await Ngos.deleteMany();
//     const volunteer = await Users.deleteMany();
//     const project = await Projects.deleteMany();
//     const admin = await Admin.deleteMany();
//     const reward = await Rewards.deleteMany();
//     if (ngo && reward &&  volunteer && project && admin) {
//       res.status(200).send("All data removed");
//     }
//     else {
//       res.status(404).send("Error deleting All");
//     }
//   }
//   catch (error) {
//     console.log("Internel Server Error");
//     res.status(500).send("Internel Server Error")
//   }
// });

//Authentication


app.get('/auth', authenticate, async (req, res) => {
})
//Logout Page
app.get('/logout', (req, res) => {
  res.clearCookie("jwt", { path: '/' })
  res.status(200).send("User Logged Out");
})
//Account Initiate
async function initializeAdminAccount() {
  const adminCount = await Admin.countDocuments();

  if (adminCount === 0) {
      const account = new Admin({});
      let createdUser = await account.save();
      if (createdUser) {
          console.log("Admin account initialized.");
      } else {
          console.log("Failed to initialize admin account.");
      }
  }
  else
  {
    console.log("Admin account exists.");

  }
}
const PORT = process.env.PORT || 3006; 
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
  initializeAdminAccount();
});
