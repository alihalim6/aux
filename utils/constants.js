export const AUX_NAMESPACE = 'aux.';
export const AUX_MODE = 'auxMode';
export const IGNORED_USERS = 'ignoredUsers';

export const SPLASH = 'splash';
export const APP = 'live';

export const PLAYED_NOT_SKIPPED_THRESHOLD = 30;

export const DEVICE_ID = 'deviceId';
export const AUX_DEVICE_NAME = 'PASS THE AUX';

/* 
  streaming - playback
  user-read-email - email not used at all, scope only required due to user profile endpoint usage
  user-read-private - display user profile names and images, and Spotify ID for uniquely attributing AUX activity
  user-follow-modify - user has ability to follow other AUX users on Spotify
  user-follow-read - ability to determine whether or not logged in user already follows other AUX users on Spotify
  user-library-modify - user can like tracks and albums
  user-library-read - determining if user already likes tracks, albums and playlists, as well as displaying user's liked tracks and albums
  user-top-read - user has ability to view and play their top tracks and artists
  user-read-recently-played - user has ability to view and play theirrecently played tracks
  user-modify-playback-state - playback control
  playlist-read-collaborative - searching and displaying playlists
  playlist-read-private - displaying user's playlists
  playlist-modify-public - required to be able to modify user's own playlists
  playlist-modify-private - ability to modify user's own playlists
*/

export const AUTH = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRES_IN: 'expires_in',
  TOKEN_SET_AT: 'tokenSetAt',
  CODE_VERIFIER: 'codeVerifier',
  CLIENT_ID: '979fd17ac8d141b083cd596b15a5f6bd',
  AUX_API_TOKEN: 'auxApiToken',

  SCOPES: `
    streaming 
    user-read-email 
    user-read-private 
    user-follow-modify
    user-follow-read 
    user-library-modify 
    user-library-read 
    user-top-read 
    user-read-recently-played 
    user-modify-playback-state
    playlist-read-collaborative 
    playlist-read-private 
    playlist-modify-public
    playlist-modify-private
  `,

  URL: {
    TOKEN: 'https://accounts.spotify.com/api/token',
    AUTHORIZE: 'https://accounts.spotify.com/authorize',
    REDIRECT: process.env.BASE_URL
  }
};

export const MY_AUX = {
  LIKED_TRACKS: 'Liked Songs',
  LIKED_ALBUMS: 'Liked Albums',
  RECENTLY_PLAYED: 'Recently Played*',
  TOP_ITEMS: 'Top Tracks \'n\' Artists'
};

export const PLAYLISTS = {
  FEATURED: 'FEATURED',
  BY_ME: 'BY ME',
  LIKED: 'LIKED'
};

export const REMOVED_FROM_LIKES = 'removed from Likes';
export const ADDED_TO_LIKES = 'added to Likes';
export const LIKED_ITEM_EVENT = 'likedItem';
export const REMOVED_LIKED_ITEM_EVENT = 'removedLikedItem';

export const UNFOLLOWED = 'Unfollowed';
export const NOW_FOLLOWING = 'Now following';