import express from 'express';
import axios from 'axios';
import {config, API_URL} from './_utils';

const router = express.Router();
let accessToken;

async function playItem(req, res){
    try{
        accessToken = req.headers['access-token'];
        const itemUri = req.body.item.uri;
        const requestBody = req.body.item.isTrack ? {uris: [itemUri]} : {context_uri: itemUri};

        //apparently needed for Spotify to consider this device active and able to play items (https://developer.spotify.com/documentation/web-api/reference/#/operations/transfer-a-users-playback) 
        if(req.body.devicePlaybackTransferNeeded){
            console.log('playback transfer requested for this device');
            await axios.put(`${API_URL}/me/player`, {device_ids: [req.body.deviceId]}, config(accessToken));
        }
        else{
            console.log('no playback transfer needed for this device');
        }

        await axios.put(`${API_URL}/me/player/play?deviceId=${req.body.deviceId}`, requestBody, config(accessToken));
        res.end();
    }
    catch(error){
        res.json({error});
    }
};

router.post('/', playItem);

if(process.env.NODE_ENV === 'development'){
    module.exports = router;
}    

export default playItem;