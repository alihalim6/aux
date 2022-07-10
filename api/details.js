import {httpClient, apiConfig} from './_utils';

async function details(req, res){
  try{
    const accessToken = req.headers['access-token'];
    let itemDetailsId = req.body.itemDetailsId;
    const isAlbum = req.body.isAlbum;
    const isTrack = req.body.isTrack;
    const isArtist = req.body.isArtist;
    const isPlaylist = req.body.isPlaylist;
    const playlistTrackLimit = 50;
    const singleArtistId = req.body.singleArtistId;
    const defaultResponse = {data: {}};

    let artistAlbums = defaultResponse;
    let artistTopTracks = defaultResponse;
    let relatedArtists = defaultResponse;
    let albumTracks = defaultResponse;
    let playlistTracks = [];
    let playlistTotalTracks;
    
    if(isAlbum || isTrack){
      albumTracks = await httpClient.get(`/albums/${itemDetailsId}/tracks?limit=50`, apiConfig(accessToken));
    }
    
    if(isArtist || singleArtistId){
      //get artist data as well for singles
      if(singleArtistId){
          itemDetailsId = singleArtistId;
      }
      
      artistAlbums = await httpClient.get(`/artists/${itemDetailsId}/albums?limit=30&include_groups=album,compilation`, apiConfig(accessToken));
      //Spotify sends back explicit and clean albums, so filter out clean ones
      artistAlbums.data.items = [...new Map(artistAlbums.data.items.map(album => [album['name'], album])).values()];

      artistTopTracks = await httpClient.get(`/artists/${itemDetailsId}/top-tracks?market=US`, apiConfig(accessToken));
      relatedArtists = await httpClient.get(`/artists/${itemDetailsId}/related-artists`, apiConfig(accessToken));
    }
    
    if(isPlaylist){
      const { data } = await httpClient.get(`/playlists/${itemDetailsId}/tracks?limit=${playlistTrackLimit}`, apiConfig(accessToken));
      playlistTracks = data.items;
      playlistTotalTracks = data.total;
    }

    res.json({
      artistAlbums: artistAlbums.data.items,
      artistTopTracks: artistTopTracks.data.tracks,
      relatedArtists: relatedArtists.data.artists,
      albumTracks: albumTracks.data.items,
      playlists: {
        tracks: playlistTracks,
        totalTracks: playlistTotalTracks,
        limit: playlistTrackLimit
      }
    });
  }
  catch(error){
   res.json({error: error.toString()});
  }
};

export default details;