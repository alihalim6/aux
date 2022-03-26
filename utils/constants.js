export const AUX_NAMESPACE = 'aux.';

export const AUTH = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN_EXPIRES_IN: 'expires_in',
    TOKEN_SET_AT: 'tokenSetAt',
    CODE_VERIFIER: 'codeVerifier',
    CLIENT_ID: '979fd17ac8d141b083cd596b15a5f6bd',
    SCOPES: 'streaming user-read-private user-follow-read user-library-modify user-library-read playlist-read-collaborative user-read-email playlist-read-private user-top-read user-read-recently-played',//TODO: may need more (e.g. allow following artists)
    URL: {
        TOKEN: 'https://accounts.spotify.com/api/token',
        AUTHORIZE: 'https://accounts.spotify.com/authorize',
        REDIRECT: window.location.host
    }
};

export const DATA = {
    REFRESH_TIME: 1800000 //30 minutes
};