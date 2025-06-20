const express=require("express")
const app=express()
const path=require("path")
const hbs=require("hbs")
const collection=require("./mongodb")
const multer=require("multer")

const templatePath = path.join(__dirname,'../templates')

app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))
app.set("view engine","hbs")
app.set("views",templatePath)
app.use(express.urlencoded({extended:false}))

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./uploads')
    },
    filename:(req,file,cb)=>{
        const newFileName=Date.now()+path.extname(file.originalname)
        cb(null,newFileName)
    }
})
const allowedTypes=[
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel'
]

const fileFilter=(req,file,cb)=>{
    if(allowedTypes.includes(file.mimetype)){
        cb(null,true)
    }
    else{
        cb(new Error('Only .pdf, .doc, .xls files are allowed!'),false)
    }
}

const upload=multer({
    storage:storage,
    limits:{
        fileSize:1024*1024*3,
    },
    fileFilter:fileFilter
})

app.get("/",(req,res)=>{
    res.render("login")
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/signup",(req,res)=>{
    res.render("signup")
})

app.post('/submitform', upload.single('userfile'), (req, res) => {
  if (!req.file || req.file.length ===0 ) {
    return res.status(400).send('No file uploaded or invalid file type.')
  }
  res.send(`File uploaded successfully: ${req.file.filename}`)
})

app.use((error,req,res,next)=>{
    if(error instanceof multer.MulterError){
        return res.status(400).send('Multer error: ${error.message}')
    }
    else if(error){
        return res.status(500).send('Something went wrong: ${error.message}')
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
    res.render("home");
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
  res.render("home");
});



