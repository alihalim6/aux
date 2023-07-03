import {MongoClient} from 'mongodb';
import auth from './_auth';
import jwt from 'jsonwebtoken';

const bodyParser = require('body-parser')
const app = require('express')();
const client = new MongoClient(process.env.MONGO_URI);
const database = client.db('aux');
const users = database.collection('users');
const bookmarksCollection = database.collection('bookmarks');

app.use(bodyParser.json());

app.post('/initialize', async (req, res) => {
  try{
    const userId = req.body.profile.id;
    const token = jwt.sign({id: userId}, process.env.AUX_SECRET);//no expiration; don't want to deal with refresh token etc
    let loggedInUser = await users.find({id: userId}).toArray();
    loggedInUser = loggedInUser.length ? loggedInUser[0] : null;

    if(!loggedInUser){
      users.insertOne({...req.body.profile});
    }

    const auxModeOn = (loggedInUser && loggedInUser.auxModeOn === false) ? false : true;

    res.json({
      token,
      auxModeOn,
      ignoredUsers: loggedInUser ? loggedInUser.ignoredUsers : []
    });
  }
  catch(error){
    console.log(error);
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

app.post('/delete', async (req, res) => {
  try{
    await users.deleteOne({id: req.body.profile.id}); 
    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.post('/addBookmark', async (req, res) => {
  try{
    const id = req.body.bookmark.userId;
    const response = await bookmarksCollection.findOne({userId: id});

    if(response){
      const {bookmarks} = response;
      bookmarks.unshift(req.body.bookmark);
      await bookmarksCollection.updateOne({userId: id}, [{$set: {bookmarks}}]); 
    }
    else{
      await bookmarksCollection.insertOne({userId: id, bookmarks: [req.body.bookmark]}); 
    }

    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.get('/bookmarks', async (req, res) => {
  try{
    const response = await bookmarksCollection.findOne({userId: req.query.userId});
    res.json(response);
  }
  catch(error){
    res.sendStatus(500);
  }
});

app.post('/removeBookmark', async (req, res) => {
  try{
    const id = req.body.userId;
    const response = await bookmarksCollection.findOne({userId: id});

    if(response){
      const {bookmarks} = response;
      bookmarks.splice(bookmarks.findIndex(existingBookmark => existingBookmark.uuid == req.body.bookmarkId), 1);
      await bookmarksCollection.updateOne({userId: id}, [{$set: {bookmarks}}]); 
    }

    res.end();
  }
  catch(error){
    res.sendStatus(500);
  }
});

module.exports = app;