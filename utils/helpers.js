import {capitalCase} from 'capital-case';

//aux-ify some of the values we get from Spotify
export const setItemMetaData = (items) => {
  items.forEach(item => {
    item.playbackIcon = 'play';
    item.isAlbum = (item.type === 'album');
    item.isArtist = (item.type === 'artist');
    item.isTrack = (item.type === 'track');

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
        item.tracksLabel = `${item.total_tracks} Tracks`;
      }

      if(item.isAlbum){
        item.albumType = capitalCase(item.album_type);
      }
    }
    else if(item.isArtist){    
      const genres = item.genres.map(genre => {
        genre = capitalCase(genre);
        //capitalCase turns r&b into R B, so account for that
        return genre.indexOf('R B') > -1 ? genre.replace('R B', 'R&B') : genre;
      });

      if(genres.length){
        item.primaryLabel = genres.slice(0, 3).join(', ');
      }

      item.secondaryLabel = item.name;
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