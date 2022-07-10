import {baseMock} from '~/utils/test.mocks';
import {createLocalVue, mount} from '@vue/test-utils';
import MyAux from '~/components/home/my.aux.vue';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import {httpClient} from '~/utils/api';
import {MY_AUX} from '~/utils/constants';

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

describe('my aux', () => {
  it('should process data and display tabs successfully', async () => {
    let myAux = {
      likedAlbums: {
        items: [{album: baseMock.multiTrackAlbum}]
      },
      likedTracks: {
        items: [{track: baseMock.track}]
      },
      recentlyPlayed: {
        items: [{track: baseMock.track}]
      },
      topItems: [{track: baseMock.track}, {album: baseMock.singleTrackAlbum}, {album: baseMock.multiTrackAlbum}]
    };

    const dataFetch = jest.spyOn(httpClient, 'get').mockImplementationOnce(() => {
      return Promise.resolve({data: myAux});
    });
    
    const wrapper = await mount(MyAux, {
      localVue,
      vuetify,
      store
    });
    
    const likedItemsTab = wrapper.find('#myAuxTabLabel0');
    const likedAlbumsTab = wrapper.find('#myAuxTabLabel1');
    const recentlyPlayedTab = wrapper.find('#myAuxTabLabel2');
    const topItemsTab = wrapper.find('#myAuxTabLabel3');

    expect(dataFetch).toHaveBeenCalled();
    expect(likedItemsTab.text()).toBe(MY_AUX.LIKED_TRACKS);
    expect(likedAlbumsTab.text()).toBe(MY_AUX.LIKED_ALBUMS);
    expect(recentlyPlayedTab.text()).toBe(MY_AUX.RECENTLY_PLAYED);
    expect(topItemsTab.text()).toBe(MY_AUX.TOP_ITEMS);
  });
});