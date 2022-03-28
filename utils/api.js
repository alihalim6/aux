import {AUTH, BASE_URL} from './constants';
import {storageGet} from './storage';
import axios from 'axios';

const httpClient = axios.create({
    baseURL: `${BASE_URL}/api`
});

httpClient.interceptors.request.use(async (config) => {
    return {
        ...config,
        headers: {'access-token': storageGet(AUTH.ACCESS_TOKEN)}
    };
});

export {httpClient};