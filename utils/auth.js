import {clearStorage} from '~/utils/storage';
import {SPLASH} from '~/utils/constants';

export const handleAuthError = (error) => {
  console.error(`${error} / Sending back to Splash page.`);
  $nuxt.$store.commit('ui/setToast', {text: 'Spotify needs you to log in again lorem ipsum...'});
  $nuxt.$store.commit('ui/closeDetailOverlays');
  $nuxt.$store.dispatch('spotify/stopPlayback');

  //clear auth from storage too so that if user goes back in browser, still land on splash
  clearStorage();

  $nuxt.$router.push(SPLASH);
};