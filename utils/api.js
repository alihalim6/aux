import {BASE_URL} from './constants';
import axios from 'axios';
import {refreshToken, accessTokenExpired} from '~/auth';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';

const httpClient = axios.create({
  baseURL: `${BASE_URL}/api`
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
  const errorMessage = response.data.error ? (response.data.error || response.data.error.message) : '';

  if(response.data.error && errorMessage){
    //TODO: seems to happen on first /playItem API call from sdk but it seems to work on next call and music plays, so for now ignore
    if(errorMessage.indexOf('502') > -1){
      return;
    }

    if(errorMessage.indexOf('401') > 1){
      await attemptTokenRefresh();
    }
    else{
      handleApiError(errorMessage);
    }
  }

  return response;
}, error => {
  handleApiError(error);
});

async function attemptTokenRefresh(){
  try{
    await refreshToken();
  }
  catch(error){
    $nuxt.$store.commit('ui/setToast', {text: 'Something went wrong, please refresh the page lorem ipsum...'});
  }
}

function handleApiError(error){
  console.error(error);
  //$nuxt.$store.dispatch('spotify/stopPlayback');
  $nuxt.$store.commit('ui/setToast', {text: 'Something went wrong lorem ipsum...'});
}

export {httpClient, handleApiError};