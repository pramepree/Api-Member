const express = require('express');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const cors = require('cors');
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
  email: String
});

const Member = mongoose.model('Member', ArticleSchema);

app.get('/get_NameMember', async (req, res) => {
  const cachedMembers = cache.get('members');
  if (cachedMembers) {
    res.json(cachedMembers);
  } else {
    try {
      const members = await Member.find();
      cache.set('members', members, 3600); // cache for 1 hour
      res.json(members);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});

app.post('/post_NameMember', async (req, res) => {
  try {
    const newMember = req.body;
    const createdMember = await Member.create(newMember);

    cache.del('members'); // invalidate cache
    res.status(201).json(createdMember);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/update_NameMember/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMember = await Member.findByIdAndUpdate(id, req.body, { new: true });
    if (updatedMember) {
      cache.del('members'); // invalidate cache
      res.json(updatedMember);
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete('/delete_NameMember/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่า id เป็น ObjectId ที่ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const deletedMember = await Member.findByIdAndDelete(id);
    if (deletedMember) {
      cache.del('members'); // invalidate cache
      res.status(204).json({ message: 'Member deleted successfully' });
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (err) {
    console.error('Error occurred while deleting member:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

app.post('/delete_NameMember', async (req, res) => { //delete by post method
  try {
    const { id } = req.body;
    const objectId = id.$oid;

    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(objectId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const deletedMember = await Member.findByIdAndDelete(objectId);
    if (deletedMember) {
      cache.del('members'); // invalidate cache
      res.status(204).json({ message: 'Member deleted successfully' });
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (err) {
    console.error('Error occurred while deleting member:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
