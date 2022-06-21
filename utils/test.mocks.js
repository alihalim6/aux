const images = [{'url': 'https://i.scdn.co/image/ab67616d0000b273462bb5a05b20c8bedf22a809'}];

const artist = {
  genres: ['doesnt matter', 'irrelevant', 'not applicable', 'should not display'],
  type: 'artist',
  images
};

const track = {
  type: 'track',
  images,
  artists: [artist],
  name: 'doesntMatter',
  duration_ms: 1
};

const album = {
  album_type: 'doesntMatter',
  type: 'album',
  images,
  name: 'doesntMatter',
  id: 'albumId'
};

export const baseMock = {
  artist,
  multipleArtists: [{...artist, name: 'artist1', id: '1'}, {...artist, name: 'artist2', id: '2'}],
  images,
  albumTracks: [
    {...track, id: 'track1', track_number: '1', imgUrl: images[0].url, name: 'track1', duration: 1},
    {...track, id: 'track2', track_number: '2', imgUrl: images[0].url, name: 'track2', duration: 1}
  ],
  name: 'doesntMatter',
  track,
  singleTrackAlbum: {
    ...album,
    artists: [artist],
    total_tracks: 1
  },
  multiTrackAlbum: {
    ...album,
    artists: [artist],
    total_tracks: 2
  }
};