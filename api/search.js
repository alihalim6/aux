import {httpClient} from './_utils';

async function search(query, type){
  let searchType = (type == 'track' || type == 'album') ? 'track,album' : type;
  const {data} = await httpClient.get(`/search?type=${searchType}&q=${query}&limit=50`);
  return data;
};

export default search;