import express from 'express';
import {httpClient, apiConfig} from './_utils';

const router = express.Router();
let accessToken;
let itemDetailsId;

const getAlbumTracks = async () => {
  return await httpClient.get(`/albums/${itemDetailsId}/tracks?limit=50`, apiConfig(accessToken));
};

const getArtistAlbums = async () => {
  return await httpClient.get(`/artists/${itemDetailsId}/albums?limit=30&include_groups=album,compilation`, apiConfig(accessToken));
};

const getArtistTopTracks = async () => {
  return await httpClient.get(`/artists/${itemDetailsId}/top-tracks?market=US`, apiConfig(accessToken));
};

const getRelatedArtists = async () => {
  return await httpClient.get(`/artists/${itemDetailsId}/related-artists`, apiConfig(accessToken));
};

async function details(req, res){
  try{
    accessToken = req.headers['access-token'];
    itemDetailsId = req.body.itemDetailsId;
    console.log(`detailsId: ${itemDetailsId}`);
    const isAlbum = req.body.isAlbum;
    const isTrack = req.body.isTrack;
    const isArtist = req.body.isArtist;
    const singleArtistId = req.body.singleArtistId;
    const defaultResponse = {data: {}};

    let artistAlbums = defaultResponse;
    let artistTopTracks = defaultResponse;
    let relatedArtists = defaultResponse;
    let albumTracks = defaultResponse;
    
    if(isAlbum || isTrack){
      albumTracks = await getAlbumTracks();
    }
    
    if(isArtist || singleArtistId){
      //get artist data as well for singles
      if(singleArtistId){
          itemDetailsId = singleArtistId;
      }
      
      artistAlbums = await getArtistAlbums();
      //Spotify sends back explicit and clean albums, so filter out clean ones
      artistAlbums.data.items = [...new Map(artistAlbums.data.items.map(album => [album['name'], album])).values()];

      artistTopTracks = await getArtistTopTracks();
      relatedArtists = await getRelatedArtists();
    }
    //else playlist TODO

    res.json({
      artistAlbums: artistAlbums.data.items,
      artistTopTracks: artistTopTracks.data.tracks,
      relatedArtists: relatedArtists.data.artists,
      albumTracks: albumTracks.data.items
    });
  }
  catch(error){
    console.log(error);
    res.json({error});
  }
};

router.post('/', details);

if(process.env.NODE_ENV === 'development'){
  module.exports = router;
}    

export default details;