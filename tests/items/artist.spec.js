import {setItemMetaData} from '~/utils/helpers';
import {baseMock} from '~/utils/test.mocks';
import {createLocalVue, mount} from '@vue/test-utils';
import TrackDetails from '~/components/overlays/itemDetails/track.details.vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import ArtistDetails from '~/components/overlays/itemDetails/artist.details.vue';
import {expectMoreFromArtistContent} from '~/tests/helpers';

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
  it('should set meta data for artist correctly', () => {
    let artistWithMetaData = setItemMetaData([baseMock.artist])[0];

    expect(artistWithMetaData.imgUrl).toBe(baseMock.images[0].url);
    expect(artistWithMetaData.secondaryLabel).toBe('Doesnt Matter, Irrelevant, Not Applicable');
    expect(artistWithMetaData.primaryLabel).toBe(baseMock.artist.name);
    expect(artistWithMetaData.singleTrack).toBeFalsy();
  });
});

describe('details overlay', () => {
  it('multi-artist item should display all artists', () => {
    let track = {
      ...baseMock.track,
      artists: baseMock.multipleArtists,
      album: {
        total_tracks: 2
      }
    };

    track = setItemMetaData([track])[0];

    //TrackDetails used arbitrarily, could be AlbumDetails too
    const wrapper = mount(TrackDetails, {
      propsData: {track},
      localVue,
      vuetify,
      store
    });

    //last artist in list of multiple (id is 0-indexed)
    const lastArtist = wrapper.find(`#trackArtist${baseMock.multipleArtists.length - 1}`);
    expect(lastArtist.text()).toBe('artist2');
  });

  it('artist should show more from artist content', () => {
    let artist = {
      ...baseMock.artist,
      details: {
        albumTracks: baseMock.albumTracks,
        artistTopTracks: baseMock.albumTracks,
        artistAlbums: [baseMock.multiTrackAlbum],
        relatedArtists: baseMock.multipleArtists
      }
    };

    artist = setItemMetaData([artist])[0];

    const wrapper = mount(ArtistDetails, {
      propsData: {artist},
      localVue,
      vuetify,
      store
    });

    expectMoreFromArtistContent(wrapper);
  });
});