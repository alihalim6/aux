export const AUX_NAMESPACE = 'aux.';
export const SPLASH = 'splash';
export const APP = 'app';
export const PLAYED_NOT_SKIPPED_THRESHOLD = 15;

export const AUTH = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRES_IN: 'expires_in',
  TOKEN_SET_AT: 'tokenSetAt',
  CODE_VERIFIER: 'codeVerifier',
  CLIENT_ID: '979fd17ac8d141b083cd596b15a5f6bd',

  SCOPES: `
    streaming 
    user-read-private 
    user-follow-modify
    user-follow-read 
    user-library-modify 
    user-library-read 
    playlist-read-collaborative 
    user-read-email 
    playlist-read-private 
    user-top-read 
    user-read-recently-played 
    user-read-playback-state 
    user-modify-playback-state
    playlist-modify-public
    playlist-modify-private
  `,//TODO: may need more (e.g. allow following artists)

  URL: {
    TOKEN: 'https://accounts.spotify.com/api/token',
    AUTHORIZE: 'https://accounts.spotify.com/authorize',
    REDIRECT: process.env.BASE_URL
  }
};

export const AUX_MODE = 'auxMode';
export const IGNORED_USERS = 'ignoredUsers';

export const MY_AUX = {
  LIKED_TRACKS: 'Liked Tracks',
  LIKED_ALBUMS: 'Liked Albums',
  RECENTLY_PLAYED: 'Recently Played',
  TOP_ITEMS: 'Top Tracks/Artists'
};

export const PLAYLISTS = {
  FEATURED: 'Featured',
  BY_ME: 'By Me',
  LIKED: 'Liked'
};

export const REMOVED_FROM_LIKES = 'Removed from Likes';
export const ADDED_TO_LIKES = 'Added to Likes';
export const LIKED_ITEM_EVENT = 'likedItem';
export const REMOVED_LIKED_ITEM_EVENT = 'removedLikedItem';

export const UNFOLLOWED = 'Unfollowed';
export const NOW_FOLLOWING = 'Now following';