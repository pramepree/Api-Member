const express = require('express');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const cache = new NodeCache();
const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
});

let gfs;
mongoose.connection.once('open', () => {
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

const storage = new GridFsStorage({
  url: connectionString,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: 'uploads', // collection name in MongoDB
      filename: `${Date.now()}-${file.originalname}`
    };
  }
});

const upload = multer({ storage });

const ArticleSchema = new mongoose.Schema({
  user: String,
  password: String,
  email: String,
  image: String // เพิ่มฟิลด์สำหรับจัดเก็บชื่อไฟล์รูปภาพ
});

const member_table = mongoose.model('members', ArticleSchema);

app.get('/get_NameMember', async (req, res) => {
  const cachedMembers = cache.get('members');
  if (cachedMembers) {
    res.json(cachedMembers);
  } else {
    try {
      const members = await member_table.find();
      cache.set('members', members, 3600); // cache for 1 hour
      res.json(members);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});

app.post('/post_NameMember', upload.single('file'), async (req, res) => {
  try {
    const { user, password, email } = req.body;
    const newNameMember = {
      user,
      password,
      email,
      image: req.file.filename // บันทึกชื่อไฟล์รูปภาพในฐานข้อมูล
    };
    const createdNameMember = await member_table.create(newNameMember);

    cache.del('members'); // invalidate cache
    res.status(201).json(createdNameMember);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ err: 'No file exists' });
    }

    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
