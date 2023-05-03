import {httpClient} from './_utils';

//dynamic direct passthru from client to Spotify for one-off calls
async function spotify({url, method = 'GET', body = {}}){
  try {
    const {data} = await httpClient({url, method, data: body});
    return data;
  }
  catch(error){
    $nuxt.error();
    return;
  }
}

export default spotify;