import {httpClient, apiConfig} from './_utils';

//direct passthru from client to Spotify
async function passthru(req, res){
  try{
    const accessToken = req.headers['access-token'];
    const url = req.body.url;
    const method = req.body.method;
    const data = req.body.data;

    const response = await httpClient({...apiConfig(accessToken), url, method, data});

    res.json(response.data);
  }
  catch(error){
   res.json({error: error.toString()});
  }
}

export default passthru;