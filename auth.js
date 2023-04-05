import {storageGet, storageSet, storageGetAndRemove, clearStorage} from '~/utils/storage';
import {AUTH, SPLASH} from '~/utils/constants';
import axios from 'axios';
import {UI} from '~/store/constants';

export const auxApiClient = axios.create({
  baseURL: process.env.BASE_URL
});

export const authorize = async () => {
  const state = Math.random().toString(36).substring(2, 15);
  const codeVerifier = pkceVerifier();
  storageSet(AUTH.CODE_VERIFIER, codeVerifier);
  const codeChallenge = await pkceChallenge(codeVerifier);

  window.location.assign(`${AUTH.URL.AUTHORIZE}?client_id=${AUTH.CLIENT_ID}&redirect_uri=${AUTH.URL.REDIRECT}&response_type=code&state=${state}&scope=${AUTH.SCOPES}&code_challenge_method=S256&code_challenge=${codeChallenge}`);
};

export const initToken = async () => {
  await axios.post(AUTH.URL.TOKEN, 
    `grant_type=authorization_code&code=${$nuxt.$route.query.code}&redirect_uri=${AUTH.URL.REDIRECT}&client_id=${AUTH.CLIENT_ID}&code_verifier=${storageGet(AUTH.CODE_VERIFIER)}`, 
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    .then(response => setTokenData(response));
};

export const refreshToken = async () => {
  if(storageGet(AUTH.REFRESH_TOKEN)){//if refresh not already attempted
    await axios.post(AUTH.URL.TOKEN, 
      `grant_type=refresh_token&refresh_token=${storageGetAndRemove(AUTH.REFRESH_TOKEN)}&client_id=${AUTH.CLIENT_ID}`, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
      .then(response => setTokenData(response));
  }
};

export const accessTokenExpired = () => {
  const tokenExpirationTime = parseInt(storageGet(AUTH.TOKEN_SET_AT)) + parseInt(storageGet(AUTH.TOKEN_EXPIRES_IN));
  ////console.log(`token expires/expired ${tokenExpirationTime - Date.now()}ms from now`);
  return tokenExpirationTime < (Date.now() + 300000);//within 5 minutes of expiring or already expired
};

export const handleAuthError = (error) => {
  //console.error(`${error} / Sending back to Splash page.`);
  $nuxt.$store.commit(`${UI}/setToast`, {text: 'Spotify needs you to log in again lorem ipsum...', error: true});
  $nuxt.$root.$emit('closeOverlay');
  $nuxt.$store.dispatch('spotify/stopPlayback');

  //clear auth from storage too so that if user goes back in browser, still land on splash
  clearStorage();

  $nuxt.$router.push({name: SPLASH, params: {loggedIn: true}});
};

const setTokenData = (response) => {
  storageSet(AUTH.ACCESS_TOKEN, response.data.access_token);
  storageSet(AUTH.REFRESH_TOKEN, response.data.refresh_token);
  storageSet(AUTH.TOKEN_EXPIRES_IN, (response.data.expires_in * 1000));//convert seconds to ms
  storageSet(AUTH.TOKEN_SET_AT, Date.now());
};

const pkceVerifier = () => {
  const array = new Uint32Array(43);
  window.crypto.getRandomValues(array);
  return Array.from(array, d => (`0${d.toString(16)}`).substr(-2)).join('');
};

const sha256 = (str) => {
  return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
};

const base64urlEncode = (string) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const pkceChallenge = async (verifier) => {
  const hash = await sha256(verifier);
  return base64urlEncode(hash);
};