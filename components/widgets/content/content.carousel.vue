<template>
    <section>
      <div class="content-carousel" :class="{'more-from-artist-carosuel': moreFromArtist, 'vertical-carousel': vertical}">
        <div v-for="(item, index) in data" :key="item.uuid">
          <v-hover v-slot="{hover}">
            <v-card 
              max-width="175" 
              elevation="10" 
              class="clickable" 
              :class="{'content-hover': hover, 'spaced-content': moreFromArtist, 'no-max-width': vertical, 'last-item': !vertical && (index == data.length - 1)}"
            >
              <v-img class="content-img" :src="item.imgUrl.medium" @click="displayDetailOverlays(item)">
                <template v-slot:placeholder>
                  <span class="content-placeholder" v-if="item.primaryLabel">{{item.primaryLabel.substring(0, 1)}}</span>
                </template>
              </v-img>
            </v-card>
          </v-hover>
          
          <div :class="{'pb-8': vertical}">
            <div class="primary-container">
              <div class="primary-label" :class="{'artist-secondary-label': item.isArtist, 'more-from-padding': moreFromArtist}">{{item.primaryLabel}}</div>

              <div class="item-icon-container">
                <PlaybackIcon v-if="!item.isCollection" :item="item" :itemSet="data"/>
                <ThreeDotIcon v-if="!item.isCollection" :item="item"/>
              </div>
            </div>

            <div v-if="!moreFromArtist" class="secondary-label" :class="{'artist-primary-label': item.isArtist}">{{item.secondaryLabel}}</div>

            <div class="secondary-label bottom-label">
              <v-icon v-if="item.numberOfTracks" class="record-icon" small>mdi-music-circle</v-icon>
              <span>{{item.numberOfTracks}}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';
  
  @Component
  export default class ContentCarousel extends Vue {
    @Prop({required: true})
    data;
  
    @Prop({default: false})
    moreFromArtist;

    @Prop({default: false})
    vertical;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;
  }
</script>

<style lang="scss">
  $content-img-size: 275px;
  $label-left-padding: 6px;
  $secondary-label-font-size: 12px;
  $primary-label-font-size: 14px;

  .content-carousel {
    display: flex;
    overflow: scroll;
    margin-top: 12px;

    .content-hover {
      border: 2px solid;
    }

    .spaced-content {
      margin-right: 103px;
    }

    .last-item {
      max-width: $content-img-size !important;
    }

    .content-img {
      min-width: $content-img-size;
      min-height: $content-img-size;
      max-height: $content-img-size;

      .content-placeholder {
        font-size: 120px;
        font-weight: bold;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        padding-left: $base-padding;
      }
    }

    .secondary-label {
      font-size: $secondary-label-font-size;
      color: rgba(0,0,0,0.8);
      padding: 0px 8px 4px $label-left-padding;
    }

    .artist-secondary-label {
      text-overflow: unset;
      white-space: unset;
      overflow: auto;
      font-weight: 600;
      font-size: $primary-label-font-size;
    }

    .primary-container {
      display: flex;
      align-items: flex-start;
      padding: 6px 6px 4px $label-left-padding;
      justify-content: space-between;

      .primary-label {
        font-size: $primary-label-font-size;
        font-weight: 600;
        padding-top: 2px;
        padding-right: 2px;
      }
    }

    .artist-primary-label {
      @extend .primary-label;
      @extend .artist-secondary-label;
      padding-top: 0px;
      font-weight: normal;
      font-size: $secondary-label-font-size;
    }

    .more-from-padding {
      padding: 6px 52px 0px 0px;
    }

    .bottom-label {
      display: flex;
      align-items: center;
    }
  }

  .more-from-artist-carosuel {
    margin-top: 6px;
    padding: 0px $base-padding;

    .bottom-label {
      padding-left: 0px;
    }
  }

  .vertical-carousel {
    flex-direction: column;
    padding: 0px $base-padding;
  }

  .record-icon {
    color: #ed0000 !important;
  }

  .content-hover {
    z-index: 10;
    margin-top: 2px;
  }
</style>