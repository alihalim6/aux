import {httpClient, apiConfig} from './_utils';

let accessToken;

function callPlayApi(deviceId, requestBody){
  return httpClient.put(`/me/player/play?device_id=${deviceId}`, requestBody, apiConfig(accessToken));
}

async function playItem(req, res){
  try{
    accessToken = req.headers['access-token'];
    const itemUri = req.body.item.uri;
    const deviceId = req.body.deviceId;
    const requestBody = req.body.item.isTrack ? {uris: [itemUri]} : {context_uri: itemUri};

    try {
      await callPlayApi(deviceId, requestBody);
    }
    catch(error){
      console.log(`issue playing: ${error.toString()}, transferring playback...`);

      try{
        await httpClient.put('/me/player', {device_ids: [req.body.deviceId]}, apiConfig(accessToken));
      }
      catch(error){
        console.log(`issue transferring playback: ${error.toString()}; throwing error`);
        res.json({error: error.toString()});
      }

      await callPlayApi(deviceId, requestBody);
    }
        
    res.end();
  }
  catch(error){
    console.log(error);
    res.json({error: error.toString()});
  }
};

export default playItem;