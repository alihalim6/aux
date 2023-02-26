import {MongoClient} from 'mongodb';
import auth from './_auth';

const bodyParser = require('body-parser')
const app = require('express')();
const client = new MongoClient(process.env.MONGO_URI);
const database = client.db('feed');

app.use(bodyParser.json());

app.post('/initialize', async (req, res) => {
  try{
    const activities = await database.collection(`${req.body.splash ? 'splashActivities' : 'activities'}`).find({}).toArray();
    const reactions = await database.collection(`${req.body.splash ? 'splashReactions' : 'reactions'}`).find({}).toArray();
    const sortedActivities = [];
    const profile = req.body.profile || {};
    
    activities.forEach(activity => {
      activity.addedByCurrentUser = req.body.splash ? false : profile.id == activity.user.id;

      for (const reaction of reactions){        
        if(reaction.feedId == activity.feedId){
          if(!req.body.splash && reaction.author == profile.name){
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

    res.json({activities: sortedActivities});
  }
  catch(error){
    console.log(error)
    res.sendStatus(500);
  }
});

app.use(auth);

//'PROTECTED' routes

app.post('/persistActivity', async (req, res) => {
  insertItem('activities', req.body.activity, res);
});

app.post('/persistReaction', (req, res) => {
  insertItem('reactions', req.body.reaction, res);
});

async function insertItem(collection, item, res){
   try{
    const db = database.collection(collection);
    await db.insertOne({...item, persistanceTimestamp: new Date()});
    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
}

module.exports = app;