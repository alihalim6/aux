import express from 'express';
import axios from 'axios';
import {config, topItems, shuffleArray, API_URL, getRecommendationSeeds, getATopArtist} from '../_utils';

const router = express.Router();
let accessToken;

const getNewReleases = async () => {
    return await axios.get(`${API_URL}/browse/new-releases?limit=50`, config(accessToken));
};

const getRecommendedTracks = async (topArtists) => {
    const topTracks = await topItems('tracks', config(accessToken));
    const seeds = getRecommendationSeeds(topArtists, topTracks.data);
    console.log(`seeds: ${JSON.stringify(seeds)}`);

    return (seeds.artists.length || seeds.tracks.length || seeds.genres.length) ?
        await axios.get(`${API_URL}/recommendations?limit=100&seed_artists=${seeds.artists}&seed_tracks=${seeds.tracks}&seed_genres=${seeds.genres}`, config(accessToken)) :
        Promise.resolve({data: {tracks: []}});
};

const getRecommendedArtists = async (topArtists) => {
    if(topArtists.items.length){
        const topArtist = await getATopArtist(topArtists);
        console.log(`top artist seed for related artists: ${topArtist.name}`);
        return await axios.get(`${API_URL}/artists/${topArtist.id}/related-artists`, config(accessToken));
    }

    return Promise.resolve({data: {
        artists: []
    }});
};

router.get('/', async (req, res) => {
    //TODO don't recommend if already follow an artist/like a track etc.

    try{
        accessToken = req.get('access-token');
        const newReleases = await getNewReleases();
        const topArtists = await topItems('artists', config(accessToken));
        console.log(`top artists: ${JSON.stringify(topArtists.data)}`);
        const recommendedTracks = await getRecommendedTracks(topArtists.data);
        const recommendedArtists = await getRecommendedArtists(topArtists.data);

        //combine data
        let allData = Array.from(newReleases.data.albums.items);
        allData.push.apply(allData, [...recommendedTracks.data.tracks, ...recommendedArtists.data.artists]);
        shuffleArray(allData);

        //flag new releases
        newReleases.data.albums.items = newReleases.data.albums.items.map(item => {
            return {
                ...item,
                newRelease: true
            };
        });

        res.json({
            newReleases: newReleases.data.albums.items,//kept separate to use for New Releases page
            allData,
            previewData: [...Array.from(allData)].splice(0, 30)
        });
    }catch(error){
        res.json({error});
    }
});

module.exports = router;