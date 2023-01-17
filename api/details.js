import {httpClient} from './_utils';

async function details({isAlbum, isTrack, isArtist, isPlaylist, singleArtistId}, itemId){
  const playlistTrackLimit = 50;
  const defaultResponse = {data: {}};

  let artistAlbums = defaultResponse;
  let artistTopTracks = defaultResponse;
  let relatedArtists = defaultResponse;
  let albumTracks = defaultResponse;
  let playlistTracks = [];
  let totalPlaylistTracks;
  
  if(isAlbum || isTrack){
    albumTracks = await httpClient.get(`/albums/${itemId}/tracks?limit=50`);
  }
  
  if(isArtist || singleArtistId){
    //get artist data as well for singles
    if(singleArtistId){
      itemId = singleArtistId;
    }
    
    artistAlbums = await httpClient.get(`/artists/${itemId}/albums?limit=30&include_groups=album,compilation`);
    //Spotify sends back explicit and clean albums, so filter out clean ones
    artistAlbums.data.items = [...new Map(artistAlbums.data.items.map(album => [album['name'], album])).values()];

    artistTopTracks = await httpClient.get(`/artists/${itemId}/top-tracks?market=US`);
    relatedArtists = await httpClient.get(`/artists/${itemId}/related-artists`);
  }
  
  if(isPlaylist){
    const {data} = await httpClient.get(`/playlists/${itemId}/tracks?limit=${playlistTrackLimit}`);
    playlistTracks = data.items;
    totalPlaylistTracks = data.total;
  }

  return {
    artistAlbums: artistAlbums.data.items,
    artistTopTracks: artistTopTracks.data.tracks,
    relatedArtists: relatedArtists.data.artists,
    albumTracks: albumTracks.data.items,
    playlistTracks,
    totalPlaylistTracks,
    playlistTrackLimit
  };
};

export default details;