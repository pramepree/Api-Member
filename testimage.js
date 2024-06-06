const express = require('express');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
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

const ArticleSchema = new mongoose.Schema({
  user: String,
  password: String,
  email: String,
  image: {
    data: Buffer,
    contentType: String
  }
});

const member_table = mongoose.model('members', ArticleSchema);

app.post('/post_NameMember', multer().single('image'), async (req, res) => {
  try {
    const newNameMember = req.body;
    const file = req.file;
    if (file) {
      newNameMember.image = {
        data: file.buffer,
        contentType: file.mimetype
      };
    }
    const createdNameMember = await member_table.create(newNameMember);
    
    cache.del('members'); // invalidate cache
    res.status(201).json(createdNameMember);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(3050, () => {
  console.log('Server is running on port 3050');
});