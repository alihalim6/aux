import express from 'express';
import axios from 'axios';//TODO resuable client
import {config, API_URL} from './_utils';

const router = express.Router();
let accessToken;
let itemDetailId;

const getAlbumTracks = async () => {
    return await axios.get(`${API_URL}/albums/${itemDetailId}/tracks?limit=50`, config(accessToken));
};

const getArtistAlbums = async () => {
    return await axios.get(`${API_URL}/artists/${itemDetailId}/albums?limit=15`, config(accessToken));
};

const getArtistTopTracks = async () => {
    return await axios.get(`${API_URL}/artists/${itemDetailId}/top-tracks?market=US`, config(accessToken));
};

const getRelatedArtists = async () => {
    return await axios.get(`${API_URL}/artists/${itemDetailId}/related-artists`, config(accessToken));
};

async function detail(req, res){
    try{
        accessToken = req.headers['access-token'];
        itemDetailId = req.body.itemDetailId;
        console.log(`detailId: ${itemDetailId}`);
        const isAlbum = req.body.isAlbum;
        const isTrack = req.body.isTrack;
        const isArtist = req.body.isArtist;
        const singleArtistId = req.body.singleArtistId;

        let artistAlbums = {data: {}};
        let artistTopTracks = {data: {}};
        let relatedArtists = {data: {}};
        let albumTracks = {data: {}};
        
        if(isAlbum || isTrack){
            console.log(`item is album: ${isAlbum}; item is track: ${isTrack}`);
            albumTracks = await getAlbumTracks();
            console.log(`# of album tracks: ${albumTracks.data.items.length}`);
        }
        
        if(isArtist || singleArtistId){
            //get artist data as well for singles
            if(singleArtistId){
                itemDetailId = singleArtistId;
            }

            console.log(`item is artist`);
            artistAlbums = await getArtistAlbums();
            console.log(`# of albums: ${artistAlbums.data.items.length}`);
            artistTopTracks = await getArtistTopTracks();
            console.log(`# of top tracks: ${artistTopTracks.data.tracks.length}`);
            relatedArtists = await getRelatedArtists();
            console.log(`# of related artists: ${relatedArtists.data.artists.length}`);
        }
        //else playlist
        
        res.json({
            artistAlbums: artistAlbums.data.items,
            artistTopTracks: artistTopTracks.data.tracks,
            relatedArtists: relatedArtists.data.artists,
            albumTracks: albumTracks.data.items
        });
    }
    catch(error){
        res.json({error});
    }
};

router.post('/', detail);

if(process.env.NODE_ENV === 'development'){
    module.exports = router;
}    

export default detail;