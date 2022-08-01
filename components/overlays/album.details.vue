<template>
  <section>
    <div class="sub-title-container">
      <div>
        <ArtistList :artists="album.artists"/>
        <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        {{new Date(album.release_date).getFullYear()}}
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-show="album.numberOfTracks">{{album.numberOfTracks}}</span>
        <v-icon v-show="album.numberOfTracks && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        <span v-show="duration">{{duration}}</span>
      </div>
    </div>

    <div v-if="album.total_tracks > 1">
      <TrackList :tracks="album.details.albumTracks" :parentId="album.id"/>
    </div>

    <MoreFromArtist v-if="album.singleTrack" :parentItem="album" :artist="album.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData} from '~/utils/helpers';

  @Component
  export default class AlbumDetails extends Vue {
    duration = 0;

    @Prop({required: true})
    album;

    beforeMount(){
      if(this.album.singleTrack){
        this.duration = msToDuration(this.album.details.albumTracks[0].duration_ms);

        //set data for 'more from artist' content
        setItemMetaData(this.album.details.artistAlbums);
        setItemMetaData(this.album.details.artistTopTracks);
        setItemMetaData(this.album.details.relatedArtists);
      }
      else{
        this.duration = msToDuration(this.album.details.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
        setItemMetaData(this.album.details.albumTracks);

        //set image for all tracks on album
        this.album.details.albumTracks.forEach(track => track.imgUrl = this.album.imgUrl);
      }

      for(const track of this.album.details.albumTracks){
        track.fromCollection = this.album.uri;

        //needed to display track detail when clicking album track on player widget;
        //can't set whole album as that causes circular JSON error
        track.album = {...this.album};
        delete track.album.details;
      }
    }
  }
  </script>