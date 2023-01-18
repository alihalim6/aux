<template>
  <section>
    <div v-if="data.length" class="vertical-content">
      <div 
        v-for="(item, index) in data" 
        :key="item.uuid" 
        class="pb-2 mb-4" 
        :class="{'dashed-separator': index < (data.length - 1)}" 
        elevation="3"
      >        
        <v-hover v-slot="{hover}">
          <section>
            <div class="item-container" :class="{'flex-column': playlists}">  
              <v-card v-if="!playlists" max-width="40%" elevation="7">
                <v-img :src="item.imgUrl.large" class="clickable" @click="displayItemDetails(item)"></v-img>
              </v-card>

              <div v-if="playlists" class="align-start fill-available mb-4">
                <v-card :max-width="playlists ? '100%' : '90%'" elevation="7">
                  <v-img class="clickable" @click="displayItemDetails(item)" :src="item.imgUrl.large"></v-img>
                </v-card>

                <v-icon v-if="alternateFormat && !playlists" class="clickable ml-auto" @click="displayItemDetails(item)" large color="black">mdi-arrow-right</v-icon>
              </div>

              <v-icon v-if="!playlists" class="divider" :class="{'smaller-divider': alternateFormat}">mdi-slash-forward</v-icon>

              <div class="d-flex flex-column">
                <span class="clickable item-title" @click="itemTitlePressed(item)" :class="{'smaller-title': alternateFormat, 'lighter-black-color': hover}">{{item.primaryLabel}}</span>
                <span v-if="!alternateFormat" class="item-detail" :class="{'smaller-detail': alternateFormat}">{{item.secondaryLabel}}</span>
                <div class="item-detail" :class="{'smaller-detail': alternateFormat}"><v-icon v-if="item.numberOfTracks" class="record-icon">mdi-music-circle</v-icon>{{item.numberOfTracks}}</div>
              </div>

              <v-icon v-if="!alternateFormat" @click="displayItemDetails(item)" class="clickable ml-auto" color="black">mdi-arrow-right</v-icon>
            </div>

            <div class="bottom-container" :class="{'alternate-bottom-container': alternateFormat}">
              <span v-if="alternateFormat" class="item-detail" :class="{'smaller-detail': alternateFormat}">{{item.secondaryLabel}}</span>
              <timeago v-if="item.timeAgo" class="time-ago" :datetime="item.timeAgo"></timeago>

              <div class="item-icon-container">
                <PlaybackIcon v-if="!item.isCollection" :item="item" :itemSet="data"/>
                <ThreeDotIcon v-if="!item.isCollection" :item="item"/>
              </div>
            </div>
          </section>
        </v-hover>
      </div>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {SPOTIFY} from '~/store/constants';

  @Component
  export default class VerticalContent extends Vue {
    @Prop({required: true})
    data;

    @Prop()
    alternateFormat;

    @Prop()
    playlists;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    displayItemDetails(item){
      this.$nuxt.$root.$emit('displayDetailOverlay', item);
    }

    async itemTitlePressed(item){
      if(item.isCollection){
        this.displayItemDetails(item);
      }
      else{
        await this.togglePlayback({item});
      }
    }
  }
</script>

<style lang="scss">
  .vertical-content {
    display: flex;
    flex-direction: column;

    .item-container {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      padding: $base-padding $base-padding 8px;

      .divider {
        font-size: 32px;
        color: $primary-theme-color;
        margin-left: 8px;
      }

      .smaller-divider {
        font-size: 20px;
      }

      .item-title {
        font-size: 22px;
        line-height: 1.3;
        padding-bottom: 2px;
        font-weight: bold;
        word-break: break-word;
      }

      .smaller-title {
        font-size: 16px;
      }
    }

    .bottom-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 41%;
      margin-bottom: 2px;

      .time-ago {
        font-size: 14px;
        padding-left: $base-padding;
        font-weight: bold;
        color: #888888;
      }
    }

    .alternate-bottom-container {
      max-width: unset;
      padding: $base-padding;
    }

    .item-detail {
      font-size: 14px;
      padding-bottom: 2px;
      display: flex;
      align-items: center;
      font-weight: bold;
      color: #888888;
    }

    .smaller-detail {
      align-items: flex-start;

      .v-icon {
        padding-top: 1px;
        font-size: 20px;
      }
    }
  }
</style>