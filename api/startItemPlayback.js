import {storageGet} from '~/utils/storage';
import {httpClient, PLAYBACK_API_PATH} from './_utils';
import {DEVICE_ID} from '~/utils/constants';

async function startItemPlayback(item){
  const requestBody = item.isTrack ? {uris: [item.uri]} : {context_uri: item.uri};
  return httpClient.put(`${PLAYBACK_API_PATH}?device_id=${storageGet(DEVICE_ID)}`, requestBody);
};

export default startItemPlayback;