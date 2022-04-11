import {capitalCase} from 'capital-case';

export const setItemDisplayData = (item) => {
    item.playbackIcon = 'play';
    item.isAlbum = (item.type === 'album');
    item.isArtist = (item.type === 'artist');
    item.isTrack = (item.type === 'track');

    try{
        item.imgUrl = item.images ? item.images[0].url : item.album.images[0].url;
    }
    //not all items have images
    catch(error){
        console.log('there was an issue getting item\'s image');
    }
    
    if(item.isAlbum || item.isTrack){
      const artists = item.artists.map(artist => artist.name);
      item.subLabel = artists.join(', ');
      item.primaryLabel = item.name;

      if(item.isAlbum && item.total_tracks > 1){
        item.bottomLabel = `${item.total_tracks} Tracks`;
      }

      if(item.isAlbum){
          item.albumType = capitalCase(item.album_type);
      }
    }
    else if(item.isArtist){
      item.subLabel = item.name;
      
      const genres = item.genres.map(genre => {
        genre = capitalCase(genre);
        //capitalCase turns r&b into R B, so account for that
        return genre.indexOf('R B') > -1 ? genre.replace('R B', 'R&B') : genre;
      });

      if(genres.length){
        item.primaryLabel = genres.slice(0, 3).join(', ');
      }
    }
  };

  export const setDetailsDisplayData = (details) => {
    details.forEach(item => {
      setItemDisplayData(item);
  });
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