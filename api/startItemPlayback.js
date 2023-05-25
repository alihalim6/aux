import {storageGet} from '~/utils/storage';
import {httpClient, PLAYBACK_API_PATH} from './_utils';
import {DEVICE_ID} from '~/utils/constants';

async function startItemPlayback(item, nextTracks){
  let requestBody = {uris: [item.uri]};

  if(nextTracks){
    console.log(`next tracks: ${nextTracks.map(track => track.name)}`);
    requestBody.uris.push.apply(requestBody.uris, nextTracks.map(track => track.uri));
  }
  else{
    requestBody = {context_uri: item.uri};
  }

  return httpClient.put(`${PLAYBACK_API_PATH}?device_id=${storageGet(DEVICE_ID)}`, {...requestBody, position_ms: 0});
};

export default startItemPlayback;