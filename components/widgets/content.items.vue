<template>
    <section>
        <div class="content-carousel">
            <div v-for="(item, index) in data" :key="item.id">
                <v-hover v-slot="{hover}">
                    <v-card max-width="175" elevation="10" class="clickable" :class="{'content-hover': hover}">
                      <v-img class="content-img" :src="item.imgUrl" @click="displayDetailOverlay(item)"></v-img>
                      <PlaybackIcon :item="item" icon-class="playback-button" :conditional-icon-class="{'last-item-playback-button': (index === data.length - 1)}"/>
                    </v-card>
                </v-hover>
                
                <div class="sub-text" :class="{'artist-sub-label': item.isArtist}">{{item.subLabel}}</div>
                <div class="primary-text" :class="{'artist-primary-text': item.isArtist}">{{item.primaryLabel}}</div>
                <div class="sub-text bottom-label"><v-icon v-show="item.bottomLabel" class="record-icon" small>mdi-music-circle</v-icon>{{item.bottomLabel}}</div>
            </div>
        </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter} from 'nuxt-property-decorator';
  
  @Component
  export default class ContentItems extends Vue {
      @Prop({required: true})
      data;

      @Action('togglePlayback', {namespace: 'spotify'})
      togglePlayback;

      @Action('displayDetailOverlay', {namespace: 'ui'})
      displayDetailOverlay;

      @Getter('currentlyPlayingItemUri', {namespace: 'spotify'})
      currentlyPlayingItemUri;

      @Getter('spotifyPlayer', {namespace: 'spotify'})
      spotifyPlayer;
  }
  </script>

<style lang="scss">
  .record-icon {
    color: #ed0000 !important;
  }

  .content-hover {
    z-index: 100;
    margin-top: 2px;
  }
</style>