<template>
  <section>
    <div class="sub-title-container">
        <div class="secondary-label">{{artist.primaryLabel}}</div>
    </div>

    <MoreFromArtist :parentItem="artist" :artist="artist"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';

  @Component
  export default class ArtistDetails extends Vue {
    @Prop({required: true})
    artist;

    beforeMount(){
      setItemMetaData(this.artist.details.artistAlbums);
      setItemMetaData(this.artist.details.artistTopTracks);
      setItemMetaData(this.artist.details.relatedArtists);
    }
  }
  </script>