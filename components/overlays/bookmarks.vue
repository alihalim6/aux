<template>
  <v-dialog content-class="pa-0 mt-0" :value="true" width="fill-available" @click:outside="$nuxt.$emit('closeModal')" transition="v-fade-transition">
    <div class="bookmarks container">
      <div class="d-flex flex-column title-container">
        <v-icon class="clickable ml-4 align-self-end" color="black" large @click="$nuxt.$emit('closeModal')" aria-label="close user profile modal">mdi-close</v-icon>

        <div class="title">
          <span>Bookmarks</span><span class="ml-1">(/'bʊk.mɑːrks/)</span
        ></div>
      </div>

      <div class="subtitle">Shit you wanna listen to at a later point in time.</div>

      <ContentCarousel v-if="bookmarks.length" :data="bookmarks" :bookmarks="true"/>

      <div v-else-if="loading" class="oscillating-loading-container mt-2">
        <div class="black-background loading"></div>
      </div>

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
    loading = false;

    @Getter('profile', {namespace: USER})
    profile;

    async beforeMount(){
      this.loading = true;
      
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

      this.loading = false;

      this.$nuxt.$root.$on('bookmarkAdded', bookmark => this.bookmarks.unshift(bookmark));

      this.$nuxt.$root.$on('bookmarkRemoved', bookmarkId => {
        this.bookmarks.splice(this.bookmarks.findIndex(existingBookmark => existingBookmark.uuid == bookmarkId), 1);
      });
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
    padding: 26px;

    .title {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
      flex-wrap: wrap;
      width: fit-content;

      span {
        font-size: 36px;
        color: $primary-theme-color;
        margin-bottom: 12px;

        @media(min-width: $max-inner-width){
          font-size: 48px;
        }
      }

      span:first-child {
        font-weight: 900;
      }
    }

    .subtitle {
      background-color: $rose-red;
      color: $cream;
      font-weight: 700;
      padding: 4px 6px;
      margin: 8px 0 24px;
      width: fit-content;
      border-radius: 6px;
    }
  }
</style>