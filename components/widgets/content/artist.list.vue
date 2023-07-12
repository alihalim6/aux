<template>
  <div class="inline-display">
    <span v-for="(artist, index) in artists" :key="artist.id">
      <button 
        :id="artist.uuid" 
        class="clickable inline-display text-left width-fit-content" 
        @click.stop="$nuxt.$root.$emit('displayArtistDetails', artist)" 
        @keydown.enter.stop="$nuxt.$root.$emit('displayArtistDetails', artist)" 
        :class="{'text-decoration-underline': underline}"
        :aria-label="`open modal with details about ${artist.name}`"
        tabindex="0"
      >
        <span>{{artist.name}}</span>
      </button><span v-if="(index < artists.length - 1)">, </span>
    </span>
  </div>
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
