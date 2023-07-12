<template>
  <v-dialog content-class="pa-0 mt-0" :value="true" width="max-content" @click:outside="$nuxt.$emit('closeModal')" transition="v-fade-transition">
    <div class="bookmarks container">
      <div class="title">
        <span>Bookmarks (/'bʊk.mɑːrks/)</span>
        <v-icon class="clickable ml-4" color="black" large @click="$nuxt.$emit('closeModal')" aria-label="close user profile modal">mdi-close</v-icon>
      </div>

      <div class="subtitle">Shit you wanna listen to at a later point in time.</div>

      <ContentCarousel v-if="bookmarks.length" :data="bookmarks" :bookmarks="true"/>
      <span v-else>Add items via three-dot menus.</span>
    </div>
  </v-dialog>
</template>

<script>
  import {Component, Vue, Getter} from 'nuxt-property-decorator';
  import {auxApiClient} from '~/utils/helpers';
  import {storageGet} from '~/utils/storage';
  import {AUTH} from '~/utils/constants';
  import {USER} from '~/store/constants';
  import {setItemMetaData} from '~/utils/helpers';
  import spotify from '~/api/spotify';

  @Component
  export default class Bookmarks extends Vue {
    bookmarks = [];

    @Getter('profile', {namespace: USER})
    profile;

    async beforeMount(){
      await this.getBookmarks();
      this.$nuxt.$root.$on('bookmarkAdded', bookmark => this.bookmarks.unshift(bookmark));

      this.$nuxt.$root.$on('bookmarkRemoved', bookmarkId => {
        this.bookmarks.splice(this.bookmarks.findIndex(existingBookmark => existingBookmark.uuid == bookmarkId), 1);
      });
    }

    async getBookmarks(){
      const response = await auxApiClient.get(`/user/bookmarks?userId=${this.profile.id}`, {
        headers: {
          Authorization: `Bearer ${storageGet(AUTH.AUX_API_TOKEN)}`
        }
      });

      if(response.data && response.data.bookmarks){
        this.bookmarks = await Promise.all(response.data.bookmarks.map(async bookmark => {
          const bookmarkItem = await spotify({url: `/${bookmark.type}s/${bookmark.id}`});
          return setItemMetaData([bookmarkItem])[0];
        }));
      }
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('bookmarkAdded');
      this.$nuxt.$root.$off('bookmarkRemoved');
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    background-color: $secondary-theme-color;
    padding: 20px;

    .title {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;

      span {
        font-size: 36px;
        color: $primary-theme-color;
        margin-bottom: 12px;

        @media(min-width: $max-inner-width){
          font-size: 48px;
        }
      }
    }

    .subtitle {
      background-color: $primary-theme-color;
      color: $secondary-theme-color;
      font-weight: 700;
      padding: 4px 6px;
      margin-bottom: 24px;
      width: fit-content;
    }
  }
</style>