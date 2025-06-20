const mongoose=require("mongoose")
mongoose.connect("mongodb://localhost:27017/TermsheetValidation")
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

