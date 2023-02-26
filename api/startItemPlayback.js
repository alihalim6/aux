import {storageGet} from '~/utils/storage';
import {httpClient, PLAYBACK_API_PATH} from './_utils';
import {DEVICE_ID} from '~/utils/constants';

async function startItemPlayback(item, nextTrack){
  let requestBody = {uris: [item.uri]};

  if(nextTrack){
    requestBody.uris.push(nextTrack.uri);
  }

  if(item.uri.indexOf('album') > 0){
    requestBody = {context_uri: item.uri};
  }

  return httpClient.put(`${PLAYBACK_API_PATH}?device_id=${storageGet(DEVICE_ID)}`, requestBody);
};

export default startItemPlayback;