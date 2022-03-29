import express from 'express';
import axios from 'axios';//TODO resuable client
import {config, API_URL} from './_utils';

const router = express.Router();
let accessToken;

const getArtist = async (itemId) => {
    return await axios.get(`${API_URL}/artists/${itemId}`, config(accessToken));
};

async function artist(req, res){
    try{
        accessToken = req.headers['access-token'];
        const artist = await getArtist(req.body.itemId);

        res.json({artist: artist.data});
    }
    catch(error){
        res.json({error});
    }
};

router.post('/', artist);

if(process.env.NODE_ENV === 'development'){
    module.exports = router;
}    

export default artist;