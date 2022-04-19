import {BASE_URL} from './constants';
import axios from 'axios';

const httpClient = axios.create({
    baseURL: `${BASE_URL}/api`
});

export {httpClient};