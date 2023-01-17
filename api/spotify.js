import {httpClient} from './_utils';

//dynamic direct passthru from client to Spotify for one-off calls
async function spotify({url, method = 'GET'}){
  const {data} = await httpClient({url, method});
  return data;
}

export default spotify;