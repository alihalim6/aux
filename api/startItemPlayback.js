import {httpClient} from './_utils';

function callPlayApi(deviceId, requestBody){
  return httpClient.put(`/me/player/play?device_id=${deviceId}`, requestBody);
}

async function startItemPlayback({item, deviceId}){
  const requestBody = item.isTrack ? {uris: [item.uri]} : {context_uri: item.uri};

  try {
    await callPlayApi(deviceId, requestBody);
  }
  catch(error){
    console.log(`issue playing: ${error.toString()}, transferring playback...`);

    try{
      await httpClient.put('/me/player', {device_ids: [deviceId]});
    }
    catch(error){
      console.log(`issue transferring playback: ${error.toString()}; throwing error`);
      res.json({error: error.toString()});
    }

    await callPlayApi(deviceId, requestBody);
  }
      
  return;
};

export default startItemPlayback;