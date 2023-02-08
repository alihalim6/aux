import {httpClient, PLAYBACK_API_PATH} from './_utils';

async function startItemPlayback({item, deviceId}){
  const requestBody = item.isTrack ? {uris: [item.uri]} : {context_uri: item.uri};
  return httpClient.put(`${PLAYBACK_API_PATH}?device_id=${deviceId}`, requestBody);
};

export default startItemPlayback;