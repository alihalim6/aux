import {BASE_URL} from './constants';
import axios from 'axios';
import {refreshToken, accessTokenExpiring} from '~/preAuth';
import {storageGet} from '~/utils/storage';
import {AUTH} from '~/utils/constants';

const httpClient = axios.create({
  baseURL: `${BASE_URL}/api`
});

httpClient.interceptors.request.use(async config => {
  if(accessTokenExpiring()){
    await attemptTokenRefresh(); 
  }
    
  return {
    ...config,
    headers: {'access-token': storageGet(AUTH.ACCESS_TOKEN)}
  };
});

httpClient.interceptors.response.use(async response => {
  const errorMessage = response.data.error ? response.data.error.message : '';

  if(response.data.error && errorMessage){
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
    $nuxt.$store.commit('ui/setToast', {display: true, text: 'Something went wrong, please refresh the page lorem ipsum...'});
  }
}

function handleApiError(error){
  console.log(error);
  $nuxt.$store.dispatch('spotify/stopPlayback');
  $nuxt.$store.commit('ui/setToast', {display: true, text: 'Something went wrong lorem ipsum...'});
}

export {httpClient};