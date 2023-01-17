import {storageGet} from '~/utils/storage';
import {AUTH, IGNORED_USERS} from '~/utils/constants';
import {refreshToken} from '~/auth';
import {handleAuthError} from '~/utils/auth';
import spotify from '~/api/spotify';
import {v4 as uuid} from 'uuid';
import {UI} from '~/store/constants';
import {handleApiError} from '~/api/_utils';

//aux-ify some of the values we get from Spotify
export const setItemMetaData = (items) => {
  if(!items){
    $nuxt.$store.commit(`$${UI}/setToast`, {text: 'Something went wrong with the data lorem ipsum...', error: true});
    return;
  }

  items.forEach(item => {
    item.playbackIcon = 'play';
    item.isAlbum = item.type === 'album';
    item.isArtist = item.type === 'artist';
    item.isTrack = item.type === 'track';
    item.isPlaylist = item.type === 'playlist';
    item.uuid = uuid();

    try{
      item.imgUrl = {};
      item.imgUrl.large = item.images ? item.images[0].url : item.album.images[0].url;

      if(item.images && item.images.length > 1){
        item.imgUrl.medium = item.images[1].url;
        item.imgUrl.small = item.images[2].url;
      }

      if(item.album.images && item.album.images.length > 1){
        item.imgUrl.medium = item.album.images[1].url;
        item.imgUrl.small = item.album.images[2].url;
      }
    }
    //not all items have images
    catch(error){
      //console.info('unable to set item\'s image url');
    }
      
    if(item.isAlbum || item.isTrack){
      const artists = item.artists.map(artist => artist.name);
      item.primaryLabel = item.name;
      item.secondaryLabel = artists.join(', ');

      if(item.isAlbum && item.total_tracks > 1){
        item.numberOfTracks = `${item.total_tracks} Tracks`;
      }

      if(item.isAlbum){
        item.albumType = (item.album_type == 'single' && item.total_tracks > 1) ? 'EP' : item.album_type.toUpperCase();
      }

      if(!item.fromCollection && item.isTrack && item.album && item.album.total_tracks > 1){
        handleItemCollection(item, item.album.uri);
      }
    }
    else if(item.isArtist){  
      item.primaryLabel = item.name;

      const genres = item.genres.map(genre => genre.toUpperCase());

      if(genres.length){
        item.secondaryLabel = genres.slice(0, 2).join(' / ');
      }
    }
    else if(item.isPlaylist){
      item.primaryLabel = item.name;
      item.secondaryLabel = item.description;
      item.numberOfTracks = `${item.tracks.total} Tracks`;
      item.albumType = 'PLAYLIST';
    }

    item.singleTrack = (item.isAlbum && (item.total_tracks === 1)) || (item.isTrack && (!item.album || item.album.total_tracks === 1));
    item.isCollection = (item.isAlbum && !item.singleTrack) || item.isPlaylist;

    if(item.singleTrack){
      item.singleArtistId = item.artists[0].id;
    }
  });

  return items;
};

export const handleItemCollection = (item, collectionId) => {
  if(item.fromCollection){
    item.fromCollection.push(collectionId);
  }
  else{
    item.fromCollection = [collectionId];
  }
};

//adapted from https://stackoverflow.com/a/9763769
export const msToDuration = (ms) => {
  function pad(n, paddingCheck) {
    let padding = 2;

    if(paddingCheck && (n < 10)){
      padding = 1;
    }

    return ('00' + n).slice(-padding);
  };

  let s = (ms - (ms % 1000)) / 1000;
  const secs = Math.ceil(s % 60);
  s = (s - secs) / 60;
  const mins = s % 60;
  const hrs = (s - mins) / 60;

  return (hrs ? pad(hrs, true) + ':' : '') + (mins ? pad(mins, !hrs) + ':' : '0:') + pad(secs, (!mins && secs >= 10));
};

export const getItemDuration = async (item) => {
  const trackWithAlbum = (item.type == 'track') && item.album;

  if((item.type == 'album' || trackWithAlbum) && item.id && !item.duration_ms){
    try {
      const data = await spotify({url: `/albums/${trackWithAlbum ? item.album.id : item.id}/tracks`});
      return data.items[0].duration_ms;
    }
    catch(error){
      handleApiError('There was an issue loading track duration information lorem ipsum...');
      return 0;
    }
  }

  return item.duration_ms;
};

const retryPlayerInit = async () => {
  try{
    await refreshToken();
    initSpotifyPlayer();
  }
  catch(error){
    handleAuthError('Couldn\'t init player.');
  }
};

//this also makes whatever device/browser that user is on avaiable as a Spotify Connect device (e.g speaker); 
//tested and worked to play track from iphone Spotify to browser;
//TODO: tie this in as a way to be live on aux (from Spotify -- user who prefers their interface)?
//EDIT: doesn't seem doable as we'd need a hook to know/display something has been played from elsewhere etc. 
//EDIT: --> maybe sptofiy tracking object has this info
export const initSpotifyPlayer = () => {
  let accessToken = storageGet(AUTH.ACCESS_TOKEN);

  function newPlayer(){
    return new Spotify.Player({
      name: 'AUX',
      getOAuthToken: callback => {callback(accessToken)},
      volume: 1
    });
  }

  window.spotifyPlayer = newPlayer();

  window.spotifyPlayer.connect().then(connected => {
    console.log(`Connected to Spotify player: ${connected}`);

    if(!connected){
      console.log(`Retrying...`);
      retryPlayerInit();
    }
  });

  window.spotifyPlayer.addListener('ready', async ({device_id}) => {
    console.log(`Spotify player ready with device id ${device_id}`);
    $nuxt.$store.commit('spotify/setSpotifyDeviceId', device_id);
  });

  window.spotifyPlayer.addListener('authentication_error', async ({message}) => {
    console.error(`Unauthorized to connect with Spotify player: ${message}. Refreshing token and retrying.`);
    retryPlayerInit();
  });
};

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffleArray = (array) => {
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

export function isSameTrack(trackA, trackB){
  return (trackA.name == trackB.name) && 
        (trackA.duration_ms == trackB.duration_ms) && 
        (trackA.track_number == trackB.track_number);
}

export function ignoredUsers(){
  if(process.client){
    return storageGet(IGNORED_USERS) ? storageGet(IGNORED_USERS).split(',') : [];
  }

  return [];
}

//important for isSameTrack()
export async function setDuration(item){
  item.duration_ms = await getItemDuration(item);

  if(!item.duration){
    item.duration = msToDuration(item.duration_ms);
  }        
}