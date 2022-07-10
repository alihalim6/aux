import {capitalCase} from 'capital-case';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';
import {refreshToken} from '~/auth';
import {handleAuthError} from '~/utils/auth';
import {httpClient} from '~/utils/api';

//aux-ify some of the values we get from Spotify
export const setItemMetaData = (items) => {
  items.forEach(item => {
    item.playbackIcon = 'play';
    item.isAlbum = (item.type === 'album');
    item.isArtist = (item.type === 'artist');
    item.isTrack = (item.type === 'track');
    item.isPlaylist = (item.type === 'playlist');

    try{
      item.imgUrl = item.images ? item.images[0].url : item.album.images[0].url;
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
        item.albumType = capitalCase(item.album_type);
      }
    }
    else if(item.isArtist){  
      item.primaryLabel = item.name;

      const genres = item.genres.map(genre => {
        genre = capitalCase(genre);
        //capitalCase turns r&b into R B, so account for that
        return genre.indexOf('R B') > -1 ? genre.replace('R B', 'R&B') : genre;
      });

      if(genres.length){
        item.secondaryLabel = genres.slice(0, 3).join(', ');
      }
    }
    else if(item.isPlaylist){
      item.primaryLabel = item.name;
      item.secondaryLabel = item.description;
      item.numberOfTracks = `${item.tracks.total} Tracks`;
      item.albumType = 'Playlist';
    }

    item.singleTrack = (item.isAlbum && (item.total_tracks === 1)) || (item.isTrack && (!item.album || item.album.total_tracks === 1));

    if(item.singleTrack){
      item.singleArtistId = item.artists[0].id;
    }
  });

  return items;
};

//adapted from https://stackoverflow.com/a/9763769
export const msToDuration = (ms) => {
  if(!ms){
    return '';
  }

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

  return (hrs ? pad(hrs, true) + ':' : '') + (mins ? pad(mins, !hrs) + ':' : '0:') + pad(secs, !mins);
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
      name: 'Aux',
      getOAuthToken: callback => {callback(accessToken)},
      volume: 1
    });
  }

  const player = newPlayer();

  player.connect().then(connected => {
    $nuxt.$store.commit('spotify/setSpotifyPlayer', player);
    console.log(`Connected to Spotify player: ${connected}`);

    if(!connected){
      console.log(`Retrying...`);
      retryPlayerInit();
    }
  });

  player.addListener('ready', async ({device_id}) => {
    console.log(`Spotify player ready with device id ${device_id}`);
    $nuxt.$store.commit('spotify/setSpotifyDeviceId', device_id);

    //TODO: comment out when listening to spotify on phone (this takes playback away)
    //transfer playback to this device
    await httpClient.post('/passthru', {
      url: '/me/player',
      method: 'PUT',
      data: {device_ids: [device_id], play: true}
    });

    //TODO: calling for info purposes
    await httpClient.post('/passthru', {
      url: '/me/player/devices',
      method: 'GET'
    });
  });

  player.addListener('authentication_error', async ({message}) => {
    console.error(`Unauthorized to connect with Spotify player: ${message}. Refreshing token and retrying.`);
    retryPlayerInit();
  });
}