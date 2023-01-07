import {clearStorage} from '~/utils/storage';
import {SPLASH} from '~/utils/constants';
import {UI} from '~/store/constants';

export const handleAuthError = (error) => {
  console.error(`${error} / Sending back to Splash page.`);
  $nuxt.$store.commit(`${UI}/setToast`, {text: 'Spotify needs you to log in again lorem ipsum...', error: true});
  $nuxt.$root.$emit('closeOverlays');
  $nuxt.$store.dispatch('spotify/stopPlayback');

  //clear auth from storage too so that if user goes back in browser, still land on splash
  clearStorage();

  $nuxt.$router.push(SPLASH);
};