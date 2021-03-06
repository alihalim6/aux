export const AUX_NAMESPACE = 'aux.';
export const SPLASH = 'splash';
export const APP = 'app';
export const BASE_URL = (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.liveonaux.com');//TODO

export const AUTH = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRES_IN: 'expires_in',
  TOKEN_SET_AT: 'tokenSetAt',
  CODE_VERIFIER: 'codeVerifier',
  CLIENT_ID: '979fd17ac8d141b083cd596b15a5f6bd',
  SCOPES: 'streaming user-read-private user-follow-read user-library-modify user-library-read playlist-read-collaborative user-read-email playlist-read-private user-top-read user-read-recently-played user-read-playback-state user-modify-playback-state',//TODO: may need more (e.g. allow following artists)
  URL: {
    TOKEN: 'https://accounts.spotify.com/api/token',
    AUTHORIZE: 'https://accounts.spotify.com/authorize',
    REDIRECT: BASE_URL
  }
};

export const MY_AUX = {
  LIKED_TRACKS: 'Liked Tracks',
  LIKED_ALBUMS: 'Liked Albums',
  RECENTLY_PLAYED: 'Recently Played',
  TOP_ITEMS: 'Top Items'
};

export const PLAYLISTS = {
  FEATURED: 'Featured',
  BY_ME: 'By Me',
  LIKED: 'Liked'
};