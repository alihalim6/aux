import {MongoClient} from 'mongodb';
import auth from './_auth';
import jwt from 'jsonwebtoken';

const bodyParser = require('body-parser')
const app = require('express')();
const client = new MongoClient(process.env.MONGO_URI);
const database = client.db('feed');
const users = database.collection('users');

app.use(bodyParser.json());

app.post('/initialize', async (req, res) => {
  try{
    const token = jwt.sign({id: req.body.profile.id}, process.env.AUX_SECRET);//no expiration; don't want to deal with refresh token etc
    let loggedInUser = await users.find({id: req.body.profile.id}).toArray();
    loggedInUser = loggedInUser.length ? loggedInUser[0] : null;

    await loggedInUser ? 
      users.updateOne({id: req.body.profile.id}, [{$set: {lastAppLoad: new Date()}}]) : 
      users.insertOne({...req.body.profile, lastAppLoad: new Date()});

    const auxModeOn = (loggedInUser && loggedInUser.auxModeOn === false) ? false : true;

    res.json({
      token,
      auxModeOn,
      ignoredUsers: loggedInUser.ignoredUsers
    });
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.use(auth);

//'PROTECTED' routes

app.post('/updateAuxMode', async (req, res) => {
  try{
    await users.updateOne({id: req.body.profile.id}, [{$set: {auxModeOn: req.body.auxModeOn}}]); 
    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.post('/updateIgnoredUsers', async (req, res) => {
  try{
    await users.updateOne({id: req.body.profile.id}, [{$set: {ignoredUsers: req.body.ignoredUsers}}]); 
    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

module.exports = app;