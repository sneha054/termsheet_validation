const mongoose=require("mongoose")
mongoose.connect("mongodb+srv://{USERNAME}:{PASSWORD}@termsheetvalidation.tpgunvl.mongodb.net/")
.then(()=>{
    console.log("MongoDB is connected!")
})
.catch(()=>{
    console.log("Connection failed!")
})

const LogInSchema=new mongoose.Schema({
    Firstname:{
        type:String,
        required:true
    },
    Email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }

})

const collection=new mongoose.model("userCredentials",LogInSchema)

module.exports=collection

