<template>
  <section v-if="track">
    <v-dialog content-class="pa-0" :value="track" width="83%" max-width="max-content" @click:outside="closeModal()" transition="v-fade-transition">
      <div class="add-to-playlist">
        <div class="d-flex align-center justify-space-between mb-6 width-100">
          <span class="add-track-title">Add <span class="font-weight-bold">{{ track.name }}</span> to...</span>
          <v-icon class="clickable" color="#191414" large @click="closeModal()" aria-label="close add to playlist modal">mdi-close</v-icon>
        </div>

        <v-progress-circular class="loader" color="#1DB954" indeterminate v-if="hasPlaylists && !userPlaylists.length"></v-progress-circular>
        <ContentCarousel v-if="hasPlaylists" :data="userPlaylists" :add-to-playlist="true" :no-secondary-label="true"/>
      </div>
    </v-dialog>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Mutation, Watch} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';
  import spotify from '~/api/spotify';
  import {handleApiError} from '~/api/_utils';
  import playlists from '~/api/playlists';
  import {setItemMetaData} from '~/utils/helpers';

  @Component
  export default class AddToPlaylist extends Vue {
    hasPlaylists = true;
    userPlaylists = [];

    @Prop({required: true})
    track;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Watch('track')
    async setPlaylists(){
      const { byMe, liked } = await playlists();
      this.userPlaylists = setItemMetaData([...byMe, ...liked.filter(likedPlaylist => likedPlaylist.collaborative)]);
      this.hasPlaylists = this.userPlaylists.length;
    }

    async beforeMount(){
      await this.setPlaylists();

      this.$nuxt.$root.$on('addTrackToPlaylist', async playlist => {
        try {
          await spotify({method: 'POST', url: `/playlists/${playlist.id}/tracks?uris=${this.track.uri}`});
          this.setToast({text: `${this.track.name} added to ${playlist.name}`});
          this.$nuxt.$root.$emit('updateHomePlaylists');
        }
        catch(error) {
          handleApiError(`There was an issue adding the track to ${playlist.name}. Please try again.`);
        }
        finally {
          this.$nuxt.$emit('closeAddToPlaylistModal');
        }
      });
    }

    closeModal(){
      this.$nuxt.$emit('closeAddToPlaylistModal');
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('addTrackToPlaylist');
    }
  }
</script>

<style lang="scss" scoped>
 .add-to-playlist {
   background-color: white;
   padding: 24px $base-padding;
 }

 .add-track-title {
   font-size: 22px;
 }

 .loader {
   margin: 0px auto;
   width: 100% !important;
 }
</style>