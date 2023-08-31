<template>
  <section class="playlist-details">
    <div class="sub-title-container">
      <div>{{playlist.secondaryLabel}}</div>
    </div>

    <div v-if="playlist.owner && playlist.owner.display_name != 'Spotify'" class="logo-style by-line">by {{playlist.owner.display_name}}</div>

    <v-card class="mt-3 pa-2" elevation="7" v-if="tracks.length">
      <TrackList :tracks="tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true" :playlist-id="userOwned() ? playlist.id : null"/>
    </v-card>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Getter, Watch, Mutation} from 'nuxt-property-decorator';
  import {getMoreTracksForQueue, handleItemCollection, setItemMetaData} from '~/utils/helpers';
  import spotify from '~/api/spotify';
  import {USER, SPOTIFY, PLAYBACK_QUEUE} from '~/store/constants';

  @Component
  export default class PlaylistDetails extends Vue {
    tracks = [];
    addingMoreTracks = false;//debounce

    @Prop({required: true})
    playlist;

    @Getter('profile', {namespace: USER})
    profile;

    @Getter('currentlyPlayingCollection', {namespace: SPOTIFY})
    currentlyPlayingCollection;

    @Getter('isShuffled', {namespace: SPOTIFY})
    isShuffled;

    @Mutation('addToRestOfQueue', {namespace: PLAYBACK_QUEUE})
    addToRestOfQueue;

    @Watch('currentlyPlayingCollection')
    async handleCollectionChange(newVal){
      if(newVal == this.playlist.name && !this.isShuffled){
        const {tracks} = await getMoreTracksForQueue({
          url: `/playlists/${this.playlist.id}`, 
          itemOffset: this.playlist.details.offset,
          addingToLongPlaylist: true
        });

        tracks.forEach(track => handleItemCollection(track, this.playlist.uri));
        //console.log('adding tracks to rest of playlist queue...');
        //console.log(tracks);
        this.addToRestOfQueue(tracks);
      }
    }

    async beforeMount(){
      const { playlistTracks, totalPlaylistTracks, collectionTrackLimit } = this.playlist.details;

      const processTracks = (tracks) => {
        return tracks.map(this.setTrackData).filter(track => track.id && track.type != 'episode');
      };

      this.tracks = processTracks(playlistTracks);
      this.playlist.details.playlistTracks = this.tracks;
      this.playlist.details.preShuffledTracks = [...this.tracks];
      this.playlist.details.offset = playlistTracks.length;
      this.playlist.details.allTracksFetched = playlistTracks.length >= totalPlaylistTracks;

      this.$nuxt.$root.$on('overlayScrolled', async function(e){
        e.stopPropagation();
        const playlistOverlay = e.target;
        
        if(!this.playlist.details.allTracksFetched && !this.addingMoreTracks && this.playlist.details.offset < totalPlaylistTracks && (playlistOverlay.scrollTop + playlistOverlay.offsetHeight >= (playlistOverlay.scrollHeight - 2000))){
          this.addingMoreTracks = true;
          const {items} = await spotify({url: `/playlists/${this.playlist.id}/tracks?limit=${collectionTrackLimit}&offset=${this.playlist.details.offset}`});
          this.playlist.details.offset += collectionTrackLimit;
          this.tracks.push.apply(this.tracks, processTracks(items));
          this.addingMoreTracks = false;
        }
        
        if(this.playlist.details.offset >= totalPlaylistTracks){
          this.playlist.details.playlistTracks = this.tracks;
          this.playlist.details.allTracksFetched = true;
        }
      }.bind(this));

      this.$nuxt.$root.$on('trackAddedToPlaylist', function({track}){
        this.tracks.push(track);
      }.bind(this));

      this.$nuxt.$root.$on('trackRemovedFromPlaylist', async function({track, playlistId}){
        await spotify({
          method: 'DELETE', 
          url: `/playlists/${playlistId}/tracks`, 
          body: {
            tracks: [{uri: track.uri}]
          }
        });

        this.tracks.splice(this.tracks.findIndex(playlistTrack => playlistTrack.uuid == track.uuid), 1);
        this.$nuxt.$root.$emit('updateHomePlaylists');
      }.bind(this));
    }

    setTrackData(item){
      //ignore playlist tracks that come back from API sometimes with no data
      if(!item.track){
        return {};
      }

      handleItemCollection(item.track, this.playlist.uri);
      return setItemMetaData([item.track])[0];
    }

    userOwned(){
      return this.playlist.owner.id == this.profile.id;
    }

    beforeDestroy() {
      this.$nuxt.$root.$off('trackAddedToPlaylist');
      this.$nuxt.$root.$off('trackRemovedFromPlaylist');
      this.$nuxt.$root.$off('overlayScrolled');
    }
  }
</script>

<style lang="scss" scoped>
  .by-line {
    margin: 8px 0 0 $base-padding;
  }
</style>