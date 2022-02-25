import axios from 'axios';

//BASE CONFIG
export const API_URL = 'https://api.spotify.com/v1';

export const config = (accessToken) => {
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    };
};

//SPECIFIC ENDPOINTS

export const topItems = async (topType, config) => {
    return await axios.get(`${API_URL}/me/top/${topType}?limit=50`, config);
};

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const shuffleArray = (array) => {
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const getSeedGenres = (artists, tracks) => {
    //genres associated with artists don't seem to align with the available seed genres (/recommendations/available-genre-seeds), but we'll use them for /recommendations anyway in case there's overlap
    const genres = [];
    let seedGenres = '';

    //gather all genres from artists and tracks

    artists.items.forEach(artist => {
        genres.push.apply(genres, artist.genres);
    });

    tracks.items.forEach(track => {
        track.artists.forEach(artist => {
            genres.push.apply(genres, artist.genres);
        });
    });

    //shuffle them
    shuffleArray(genres);

    //get up to five allowable by API
    const sliceEndIndex = genres.length < 5 ? genres.length : 5;
    seedGenres = genres.slice(0, sliceEndIndex).join(',');

    return seedGenres;
};

export const getRecommendationSeeds = (artists, tracks) => {
    let seedArtists = '';
    let seedTracks = '';

    console.log(tracks.items);

    //randomize seeds
    shuffleArray(artists.items);
    shuffleArray(tracks.items);

    console.log(`arrays have been shuffled;`);

    const addSeeds = (seedObject, seed) => {
        let i = 0;

        seedObject.items.forEach(item => {
            //API allows up to five seeds
            if(i === 5){
                return;
            }
        
            seed += item.id + ',';//TODO: may need to nix comma at end for 5th seed
            console.log(`seed ${seed}`);
            i++;
        });

        return seed;
    };

    seedArtists = addSeeds(artists, seedArtists);
    seedTracks = addSeeds(tracks, seedTracks);

    return {
        artists: seedArtists,
        tracks: seedTracks,
        genres: getSeedGenres(artists, tracks)
    };
};

export const getATopArtist = (artists) => {
    shuffleArray(artists.items);
    return artists[0];
};