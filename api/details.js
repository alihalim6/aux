import {httpClient} from './_utils';

async function details({isAlbum, isTrack, isArtist, isPlaylist, singleArtistId}, itemId){
  const collectionTrackLimit = 50;
  const defaultResponse = {data: {}};

  let artistAlbums = defaultResponse;
  let artistTopTracks = defaultResponse;
  let relatedArtists = defaultResponse;
  let artistData = [];

  let albumTracks = defaultResponse;
  let playlistTracks = [];
  let totalPlaylistTracks;
  let totalAlbumTracks;
  let playlistImages = [];
  
  if(isAlbum || isTrack){
    const {data} = await httpClient.get(`/albums/${itemId}/tracks?limit=${collectionTrackLimit}`);
    albumTracks = data.items;
    totalAlbumTracks = data.total;
  }
  
  if(isArtist || singleArtistId){
    //get artist data as well for singles
    if(singleArtistId){
      itemId = singleArtistId;
    }

    artistData = await Promise.all([
      httpClient.get(`/artists/${itemId}/albums?limit=50&include_groups=album,compilation`),
      httpClient.get(`/artists/${itemId}/top-tracks?market=US`),
      httpClient.get(`/artists/${itemId}/related-artists`)
    ]);

    artistAlbums = artistData[0];
    artistTopTracks = artistData[1];
    relatedArtists = artistData[2];
  }
  
  if(isPlaylist){
    const {data} = await httpClient.get(`/playlists/${itemId}/tracks?limit=${collectionTrackLimit}`);
    playlistTracks = data.items;
    totalPlaylistTracks = data.total;

    const images = await httpClient.get(`/playlists/${itemId}/images`);
    playlistImages = images.data;
  }

  return {
    artistAlbums: artistAlbums.data.items,
    artistTopTracks: artistTopTracks.data.tracks,
    relatedArtists: relatedArtists.data.artists ? relatedArtists.data.artists.slice(0, 6) : [],
    albumTracks,
    totalAlbumTracks,
    playlistTracks,
    totalPlaylistTracks,
    collectionTrackLimit,
    playlistImages,
  };
};

export default details;