const express = require("express");
const mongoose = require("mongoose");
const collection=require("./mongodb") //schema built for singup page
const crypto = require("crypto");
const path = require("path");
const methodOverride = require("method-override");
const multer = require("multer");
const { Types } = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const session = require("express-session");
const { spawn } = require('child_process');
const app = express();
const fs=require('fs');
const os=require('os');
const { MongoClient, GridFSBucket } = require('mongodb');
const ObjectId=mongoose.Types.ObjectId;
require('dotenv').config();

// Middleware
let firstname = ''; // to store info from signup form
let email = '';
let Password = '';



app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "../public")));

// Set up HBS
const templatePath = path.join(__dirname,"..", "templates");
console.log(templatePath);
app.set("view engine", "hbs");
app.set("views", templatePath);

const USERNAME=process.env.USERNAME
const PASSWORD=process.env.PASSWORD
// Mongo URI
const mongoURI = "mongodb+srv://${USERNAME}:${PASSWORD}@termsheetvalidation.tpgunvl.mongodb.net/";
const client = new MongoClient(mongoURI);

// DB Connection
client.connect().then(() => {
  const db = client.db(); // Default DB from URI
  gridFSBucket = new GridFSBucket(db, { bucketName: 'uploads' });
  console.log("Connected and GridFSBucket initialized");
});


app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "your-secret",
  resave: false,
  saveUninitialized: false,
}));


const allowedTypes = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.ms-excel", // .xls
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "message/rfc822",
      "text/csv",
    ];
// Storage config for allowed docs
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    
    if (!allowedTypes.includes(file.mimetype)) {
      return null;
    }

    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString("hex") + path.extname(file.originalname);
        resolve({
          filename,
          bucketName: "uploads",
          metadata: {
            uploadedBy: req.body.email,
            originalname: file.originalname,
          },
        });
      });
    });
  },
});

const fileFilter=(req,file,cb)=>{
    if(allowedTypes.includes(file.mimetype)){
        cb(null,true)
    }
    else{
        cb(new Error('Only .pdf, .doc, .xls and .eml files are allowed!'),false)
    }
} //filters allowed types

const upload=multer({
    storage,
    limits:{
        fileSize:1024*1024*7, //3MB
    },
    fileFilter,
}) //acts as middleware to handle file uploads securely

// Render home.hbs with file list
app.get("/home", (req, res) => {
 gridFSBucket.find.toArray( (err, files) => {

    if(err) return res.status(500).send("error retrieving file");

    if (!files || files.length === 0) {
      return res.render("home", { files: false });
    }
    res.render("home", { files });
  });
});
app.get("/", (req, res) => {
    const Firstname=req.session?.user?.Firstname;
    res.render("frontpage", { Firstname});

});

app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/signup",(req,res)=>{
    res.render("signup")
})


app.post("/signup", async (req, res) => {
    const { Firstname, Email, password } = req.body;

    // Check if email already exists
    const existingUser = await collection.findOne({ Email });
    if (existingUser) {
        return res.render("signup", { error: "Email already exists" });
    }

    // If not, save new user
    await collection.insertMany([{ Firstname, Email, password }]);
    res.render("home",{Email});
});

app.post("/login", async (req, res) => {
  const { Email, password } = req.body;
  const user = await collection.findOne({ Email });
  if (!user || user.password !== password) {
    return res.render("login", { error: "Invalid credentials" });
  }
  res.render("home",{ Email , Firstname:user.Firstname});
});


// Handle upload from your custom form
app.post("/submitform", upload.single("userfile"),async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Only .pdf, .doc, .xls, .zip files allowed");
  }

  const email  = req.body.email;
  if(!email){
    return req.status(400).send('Email is required to upload a file.');
  }

  const user = await collection.findOne({Email:email});
  if(!user){
    return res.status(404).send('User not found.');
  }


  user.fileArray = [{
    originalname: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  }];
  await user.save();

  const tempfilePath=path.join(os.tmpdir(),req.file.filename)
  const extension=path.extname(req.file.originalname).toLowerCase()

  const writeStream=fs.createWriteStream(tempfilePath);
  const readstream=gridFSBucket.openDownloadStreamByName(req.file.filename);
  readstream.on("error", (err) => {
  console.error("Stream error:", err);
  return res.status(404).send("File not found in GridFS.");
});
  readstream.pipe(writeStream).on('finish',()=>{
  runPythonScript(tempfilePath,extension,(err,output)=>{

    fs.unlink(tempfilePath,()=>{});

    if(err)
    {
        console.error("Python script stderr:", err);
        return res.status(500).send(`Error from Python : ${err}`);
    }

    res.render("home",{
       successMessage : `File uploaded successfully: ${req.file.filename}.Validating the term sheet....`,
       pythonOutput:output
});});});});



// Download/View file
app.get("/download/:filename", (req, res) => {
  gridFSBucket.find(req.file.filename ).toArray((err, files) => {

    if(err) return res.status(500).send("error retrieving file");

    if (!file) return res.status(404).send("File not found");

    const file=files[0];
    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition",` inline;filename="${file.metadata.originalname}"`);
    const readstream=gridFSBucket.openDownloadStreamByName(file.filename);
    readstream.on("error", (err) => {
  console.error("Stream error:", err);
  return res.status(404).send("File not found in GridFS.");
});
    readstream.pipe(res);
  });
});

// Delete file
app.delete("/files/:id", (req, res) => {
  
  const fileId=new mongoose.Types.ObjectId(req.params.id);
  gridFSBucket.delete(fileId,(err)=> {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect("/home");
  });
});

// Optional: file metadata as JSON
app.get("/files", (req, res) => {
  gridFSBucket.find().toArray((err, files) => {

    if(err) return res.status(500).json({message:"Error retrieving files",error:err_message})
    if (!files || files.length===0){
       return res.status(404).json({ message: "No files" });}
    res.json(files);
  });
});


app.use((error,req,res,next)=>{
    if(error instanceof multer.MulterError){
        return res.status(400).send(`Multer error: ${error.message}`)
    }
    else if(error){
        return res.status(500).send(`Something went wrong: ${error.message}`)
    }
    next()

});

function runPythonScript(filepath,extension,callback){
    const py=spawn('C:\\tools\\Anaconda3\\python.exe',['src/Controller.py',filepath,extension]);

    let result='';

    let error='';

    py.stdout.on('data',(data)=>{
        result+=data.toString();
    });

    py.stderr.on('data',(data)=>{
        error+=data.toString();
    }
);

    py.on('close',(code) =>{
      
        if(code!=0){
            return callback(error || 'Python script failed');
        }
        callback(null,result);
    });
}

const port = 3000;
app.listen(port, () => console.log(`Server started on http://localhost:${port}`));


