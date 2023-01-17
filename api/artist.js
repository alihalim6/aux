import {httpClient} from './_utils';

async function artist(artistId){
  const {data} = await httpClient.get(`/artists/${artistId}`);
  return data;
};

export default artist;