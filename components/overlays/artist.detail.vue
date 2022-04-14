<template>
    <section>
        <div class="sub-title-container">
            <div class="sub-text">{{artist.primaryLabel}}</div>
        </div>

        <MoreFromContent :item="artist" :artist="artist"/>
    </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setDetailsDisplayData} from '~/utils/helpers';

  @Component
  export default class ArtistDetail extends Vue {
      @Prop({required: true})
      artist;

      beforeMount(){
        setDetailsDisplayData(this.artist.details.artistAlbums);
        setDetailsDisplayData(this.artist.details.artistTopTracks);
        setDetailsDisplayData(this.artist.details.relatedArtists);
      }
  }
  </script>