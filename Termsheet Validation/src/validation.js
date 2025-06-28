const express=require("express") 
const app=express() //used to define routes, responses etc.
const path=require("path") // manages file and folder paths
const hbs=require("hbs") // handle html files dynamically
const collection=require("./mongodb") //schema built for singup page
const multer=require("multer") //to handle file uploads
let firstname = ''; // to store info from signup form
let email = '';
let Password = '';

const templatePath = path.join(__dirname,'../templates')

app.use(express.json()) //lets app understand JSON formatted data
app.use(express.static(path.join(__dirname, '../public'))) //serves static files like css and images from public folder
app.set("view engine","hbs") // tells express to use hbs and template engine
app.set("views",templatePath) //tells express to find .hbs files from tempaltePath
app.use(express.urlencoded({extended:false})) // allows form data to be read

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./uploads')
    }, //files are saved in uploads folder
    filename:(req,file,cb)=>{
        const newFileName=Date.now()+path.extname(file.originalname)
        cb(null,newFileName)
    } //set filename to current date
})
const allowedTypes=[
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel'
] //allowed file types stored as MIME(Multipurpose Intrnedt Mail Exptensions)

const fileFilter=(req,file,cb)=>{
    if(allowedTypes.includes(file.mimetype)){
        cb(null,true)
    }
    else{
        cb(new Error('Only .pdf, .doc, .xls files are allowed!'),false)
    }
} //filters allowed types

const upload=multer({
    storage:storage,
    limits:{
        fileSize:1024*1024*3, //3MB
    },
    fileFilter:fileFilter
}) //acts as middleware to handle file uploads securely

app.get("/",(req,res)=>{
    res.render("login")
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/signup",(req,res)=>{
    res.render("signup")
})

app.post('/submitform', upload.single('userfile'), async (req, res) => {
  if (!req.file || req.file.length ===0 ) {
    return res.status(400).send('No file uploaded or invalid file type.')
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
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size
  }];
  await user.save();

  res.send(File uploaded successfully: ${req.file.filename})
});

app.use((error,req,res,next)=>{
    if(error instanceof multer.MulterError){
        return res.status(400).send(Multer error: ${error.message})
    }
    else if(error){
        return res.status(500).send(Something went wrong: ${error.message})
    }
    next()
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


app.listen(3000,()=>{
    console.log('Port Connected!')
})

app.post("/login", async (req, res) => {
  const { Email, password } = req.body;
  const user = await collection.findOne({ Email });
  if (!user || user.password !== password) {
    return res.render("login", { error: "Invalid credentials" });
  }
  res.render("home",{ Email });
});
