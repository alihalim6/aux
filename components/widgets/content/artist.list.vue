<template>
  <span>
    <span v-for="(artist, index) in artists" :key="artist.id">
      <span 
        :id="`trackArtist${index}`" 
        class="clickable inline-display" 
        @click.stop="$nuxt.$root.$emit('displayArtistDetails', artist)" 
        @keyup.enter.stop="$nuxt.$root.$emit('displayArtistDetails', artist)" 
        :class="{'text-decoration-underline': underline}"
        :aria-label="`open modal with details about ${artist.name}`"
        tabindex="0"
        role="button"
        >
          {{artist.name}}
        </span><span v-if="(index < artists.length - 1)">, </span>
    </span>
  </span>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';

  @Component
  export default class ArtistList extends Vue {
    @Prop({required: true})
    artists;

    @Prop({default: true})
    underline;
  }
</script>