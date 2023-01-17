import axios from 'axios';
import {refreshToken, accessTokenExpired} from '~/auth';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';
import {UI, SPOTIFY} from '~/store/constants';

const httpClient = axios.create({
  baseURL: `${process.env.BASE_URL}/api`
});

httpClient.interceptors.request.use(async config => {
  if(accessTokenExpired()){
    await attemptTokenRefresh(); 
  }
    
  return {
    ...config,
    headers: {'access-token': storageGet(AUTH.ACCESS_TOKEN)}
  };
});

httpClient.interceptors.response.use(async response => {
  if(response.data.error){
    handleApiError();
    return;
  }

  return response;
}, error => {
  handleApiError();
});

async function attemptTokenRefresh(){
  try{
    await refreshToken();
  }
  catch(error){
    $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong, please refresh the page lorem ipsum...', error: true});
  }
}

function handleApiError(){
  $nuxt.$store.commit(`${UI}/setToast`, {text: 'Something went wrong lorem ipsum...', error: true});
  $nuxt.$store.dispatch(`${SPOTIFY}/stopPlayback`);
}

export {httpClient, handleApiError};