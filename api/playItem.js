import {httpClient, apiConfig} from './_utils';

let accessToken;

async function playItem(req, res){
  try{
    accessToken = req.headers['access-token'];
    const itemUri = req.body.item.uri;
    const requestBody = req.body.item.isTrack ? {uris: [itemUri]} : {context_uri: itemUri};

    //needed for Spotify to consider this device active and able to play items (https://developer.spotify.com/documentation/web-api/reference/#/operations/transfer-a-users-playback) 
    if(req.body.devicePlaybackTransferNeeded){
      console.log('playback transfer requested for this device');
      await httpClient.put('/me/player', {device_ids: [req.body.deviceId]}, apiConfig(accessToken));
    }
    else{
      console.log('no playback transfer needed for this device');
    }

    await httpClient.put(`/me/player/play?device_id=${req.body.deviceId}`, requestBody, apiConfig(accessToken));
    res.end();
  }
  catch(error){
  console.log(error);
   res.json({error: error.toString()});
  }
};

export default playItem;