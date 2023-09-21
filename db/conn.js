const mongoose = require('mongoose');
const { DATABASE } = require("../urls");
mongoose.set("strictQuery", false);
mongoose.connect(DATABASE,{
    useNewUrlParser : true,
    useUnifiedTopology : true,
}).then(()=>{
    console.log("Connection Successful")
})