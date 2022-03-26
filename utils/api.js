import {AUTH} from './constants';
import {storageGet} from './storage';
import axios from 'axios';

const httpClient = axios.create({
    baseURL: window.location.host///TODO
});

httpClient.interceptors.request.use(async (config) => {
    return {
        ...config,
        headers: {'access-token': storageGet(AUTH.ACCESS_TOKEN)}
    };
});

export {httpClient};