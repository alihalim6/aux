import {MongoClient} from 'mongodb';
import jwt from 'jsonwebtoken';

const bodyParser = require('body-parser')
const app = require('express')();
const client = new MongoClient(process.env.MONGO_URI);
const database = client.db('feed');

app.use(bodyParser.json());

app.post('/initialize', async (req, res) => {
  try{
    if(!req.body.profile){
      res.sendStatus(400);
    }

    const token = jwt.sign({id: req.body.profile.id}, process.env.AUX_SECRET, {expiresIn: '24h'});
    const activities = await database.collection('activities').find({}).toArray();
    const reactions = await database.collection('reactions').find({}).toArray();
    const sortedActivities = [];
    
    activities.forEach(activity => {
      activity.addedByCurrentUser = req.body.profile.id == activity.user.id;

      for (const reaction of reactions){        
        if(reaction.feedId == activity.feedId){
          if(reaction.author == req.body.profile.name){
            reaction.author = 'You';
          }

          if(!activity.reactions){
            activity.reactions = [];
          }

          activity.reactions.unshift(reaction);
        }
      }
      
      sortedActivities.unshift(activity);
    });

    res.json({
      activities: sortedActivities,
      token
    });
  }
  catch(error){
    console.log(error)
    res.sendStatus(500);
  }
});

app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(token == null){
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.AUX_SECRET, err => {
    if(err){
      return res.sendStatus(403);
    }

    next();
  });
});

//'PROTECTED' routes

app.post('/persistActivity', async (req, res) => {
  try{
    const activities = database.collection('activities');
    await activities.insertOne(req.body.activity);
    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.post('/persistReaction', async (req, res) => {
  try{
    const reactions = database.collection('reactions');
    await reactions.insertOne(req.body.reaction);
    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.con

module.exports = app;