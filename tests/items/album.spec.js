import {setItemMetaData} from '~/utils/helpers';
import {baseMock} from '~/utils/test.mocks';
import {createLocalVue, mount} from '@vue/test-utils';
import AlbumDetails from '~/components/overlays/album.details.vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import {expectMoreFromArtistContent} from '../helpers';

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
  it('should set meta data for multi-track album correctly', () => {
    let albumWithMetaData = setItemMetaData([baseMock.multiTrackAlbum])[0];

    expect(albumWithMetaData.imgUrl).toBe(baseMock.images[0].url);
    expect(albumWithMetaData.primaryLabel).toBe(baseMock.name);
    expect(albumWithMetaData.numberOfTracks).toBe(`${albumWithMetaData.total_tracks} Tracks`);
    expect(albumWithMetaData.singleTrack).toBeFalsy();
  });

  it('should set meta data for single-track album correctly', () => {
    let albumWithMetaData = setItemMetaData([baseMock.singleTrackAlbum])[0];

    expect(albumWithMetaData.numberOfTracks).toBeUndefined();
    expect(albumWithMetaData.singleTrack).toBeTruthy();
    expect(albumWithMetaData.singleArtistId).toBe(baseMock.artist.id);
  });

  it('should set secondaryLabel and singleArtistId for single-track/multi-artist album correctly', () => {
    const multiArtistAlbum = {
      ...baseMock.singleTrackAlbum,
      artists: baseMock.multipleArtists,
      total_tracks: 1
    };

    let albumWithMetaData = setItemMetaData([multiArtistAlbum])[0];

    expect(albumWithMetaData.secondaryLabel).toBe(`${baseMock.multipleArtists[0].name}, ${baseMock.multipleArtists[1].name}`);
    expect(albumWithMetaData.singleArtistId).toBe(baseMock.multipleArtists[0].id);
  });
});

describe('details overlay', () => {
  let wrapper;
  let album;

  it('multi-track album should display track list', () => {
    album = {
      ...baseMock.multiTrackAlbum,
      details: {
        albumTracks: baseMock.albumTracks
      }
    };

    album = setItemMetaData([album])[0];

    wrapper = mount(AlbumDetails, {
      propsData: {album},
      localVue,
      vuetify,
      store
    });
    
    const trackNumber = wrapper.find('.track-number');
    const trackName = wrapper.find('.track-name');

    expect(trackNumber.text()).toBe(album.details.albumTracks[0].track_number)
    expect(trackName.text()).toBe(album.details.albumTracks[0].name);
  });
  
  it('single-track album should show more from artist content', () => {
    album = {
      ...baseMock.singleTrackAlbum,
      details: {
        albumTracks: baseMock.albumTracks,
        artistTopTracks: baseMock.albumTracks,
        artistAlbums: [baseMock.multiTrackAlbum],
        relatedArtists: baseMock.multipleArtists
      }
    };

    album = setItemMetaData([album])[0];

    wrapper = mount(AlbumDetails, {
      propsData: {album},
      localVue,
      vuetify,
      store
    });

    expectMoreFromArtistContent(wrapper);
  });
});