import {setItemMetaData} from '~/utils/helpers';
import {baseMock} from '~/utils/test.mocks';
import {createLocalVue, mount} from '@vue/test-utils';
import TrackDetails from '~/components/overlays/itemDetails/track.details.vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import {expectMoreFromArtistContent} from '~/tests/helpers';

const trackWithSingleTrackAlbum = {
  ...baseMock.track,
  album: {
    total_tracks: 1
  }
};

const trackWithMultiTrackAlbum = {
  ...baseMock.track,
  album: {
    total_tracks: 2,
    name: 'Doesnt Matter'
  }
};

const localVue = createLocalVue();
let NuxtStore;
let store;
let vuetify;

localVue.use(Vuex);

beforeAll(async () => {
  //https://medium.com/@brandonaaskov/how-to-test-nuxt-stores-with-jest-9a5d55d54b28
  const storePath = `${process.env.buildDir}/store.js`;
  NuxtStore = await import(storePath);
});

beforeEach(async () => {
  vuetify = new Vuetify();
  store = await NuxtStore.createStore();
});

describe('meta data', () => {
  it('should set meta data for no-album track correctly', () => {
    let trackWithMetaData = setItemMetaData([baseMock.track])[0];

    expect(trackWithMetaData.imgUrl).toBe(baseMock.images[0].url);
    expect(trackWithMetaData.primaryLabel).toBe(baseMock.name);
    expect(trackWithMetaData.singleTrack).toBeTruthy();
  });

  it('should set meta data for single-track album correctly', () => {
    let trackWithMetaData = setItemMetaData([trackWithSingleTrackAlbum])[0];
    expect(trackWithMetaData.singleTrack).toBeTruthy();
  });

  it('should set meta data for multi-track album correctly', () => {
    let trackWithMetaData = setItemMetaData([trackWithMultiTrackAlbum])[0];
    expect(trackWithMetaData.singleTrack).toBeFalsy();
  });
});

describe('details overlay', () => {
  it('track with single-track album should show more from artist content', () => {
    let track = {
      ...trackWithSingleTrackAlbum,
      details: {
        artistTopTracks: baseMock.albumTracks,
        artistAlbums: [baseMock.multiTrackAlbum],
        relatedArtists: baseMock.multipleArtists
      }
    };
    
    track = setItemMetaData([track])[0];

    const wrapper = mount(TrackDetails, {
      propsData: {track},
      localVue,
      vuetify,
      store
    });

    expectMoreFromArtistContent(wrapper);
  });

  it('track with multi-track album should show from album info', () => {
    let track = {
      ...trackWithMultiTrackAlbum,
      details: {
        artistTopTracks: baseMock.albumTracks,
        artistAlbums: [baseMock.multiTrackAlbum],
        relatedArtists: baseMock.multipleArtists
      }
    };
    
    track = setItemMetaData([track])[0];

    const wrapper = mount(TrackDetails, {
      propsData: {track},
      localVue,
      vuetify,
      store
    });

    const fromAlbumTitle = wrapper.find('#fromAlbumTitle');
    const fromAlbumTracksLabel = wrapper.find('.from-album-tracks');

    expect(fromAlbumTitle.text()).toBe(`From ${track.album.name}`);
    expect(fromAlbumTracksLabel.text()).toBe(`${track.album.total_tracks} Tracks`);
  });
});