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

const member_table = mongoose.model('members', ArticleSchema);

app.post('/post_NameMember', async (req, res) => {
  try {
    const newNameMember = req.body;
    const createdNameMember = await member_table.create(newNameMember);

    cache.del('members'); // invalidate cache
    res.status(201).json(createdNameMember);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/update_NameMember/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedNameMember = req.body;
    const result = await member_table.findByIdAndUpdate(id, updatedNameMember, { new: true });
    cache.del('members'); // invalidate cache
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

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


app.delete('/delete_NameMember/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await member_table.findByIdAndRemove(id);
    cache.del('members'); // invalidate cache
    res.status(204).json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
