const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;


// Connect to the MongoDB database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mongoose models
const User = mongoose.model('User', {
  username: String,
});

const Exercise = mongoose.model('Exercise', {
  username: String,
  description: String,
  duration: Number,
  date: String,
});

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  try {
    const newUser = await User.create({ username });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Log an exercise for a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(_id);
        
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

    const exercise = await Exercise.create({
      username:user.username,
      description,
      duration,
      date:date || new Date(),
      
    });
   
    // console.log("---------------------------------Exercise:")
    // console.log({  ...exercise.toObject() })
    // console.log("----------------------------------------")
    // console.log("---------------------------------user:")
    // console.log({  ...user.toObject() })
    // console.log("----------------------------------------")
    
    return res.json({"_id": _id, "username":user.username, "date": new Date(exercise.date).toDateString(), "duration": parseInt(exercise.duration), "description":exercise.description});

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get exercise log for a user with optional parameters
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const query = { username: user.username };

    // Apply optional date range filter
    if (from && to) {
      
      query.date = { $gte: from, $lte: to };
    }

    let log = await Exercise.find(query).limit(Number(limit) || undefined);

    log = log.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    }));

    res.json({ ...user.toObject(), count: log.length, log });
    // console.log({ ...user.toObject(), count: log.length, log })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
