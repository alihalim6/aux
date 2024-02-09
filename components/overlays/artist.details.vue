<template>
  <section>
    <div class="sub-title-container flex-column align-center mb-3">
      <div class="align-self-start">{{artist.secondaryLabel}}</div>

      <v-img 
        class="clickable img" 
        :src="artist.imgUrl.large ?? artist.imgUrl.medium" 
        @click="toggleFullImage()"
        @keydown.enter="toggleFullImage()"
        tabindex="0"
        :alt="`view larger photo for ${artist.primaryLabel}`"
        :transition="false"
      >
        <template v-slot:placeholder>
          <span class="content-placeholder">{{artist.primaryLabel.substring(0, 1)}}</span>
        </template>
      </v-img>
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

    @Prop()
    toggleFullImage;

    beforeMount(){
      const artistDetails = this.artist.details;
      setItemMetaData(artistDetails.artistAlbums);
      setItemMetaData(artistDetails.artistTopTracks);
      setItemMetaData(artistDetails.relatedArtists);
    }
  }
  </script>

  <style lang="scss">
    .img {
      width: 250px;
      margin: 12px 0;
      border-radius: 100%;
    }
  </style>