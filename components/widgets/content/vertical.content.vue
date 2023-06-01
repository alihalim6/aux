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
            <div class="item-container">  
              <div class="left-item-container">
                <v-card elevation="7">
                  <v-img 
                    :src="item.imgUrl.large" 
                    class="clickable" 
                    @click="displayItemDetails(item)"
                    @keydown.enter="displayItemDetails(item)"
                    tabindex="0"
                    :alt="`open modal with details about ${item.primaryLabel}`"
                    :transition="false"
                  >
                    <template v-slot:placeholder>
                      <span class="content-placeholder">{{item.primaryLabel.substring(0, 1)}}</span>
                    </template>
                  </v-img>
                </v-card>

                <div class="bottom-left-container">
                  <timeago v-if="item.timeAgo" class="time-ago" :converter="date => activityTimestamp(date, true)" :datetime="item.timeAgo"></timeago>

                  <div class="item-icon-container">
                    <ThreeDotIcon :item="item" icon-class="ml-1"/>
                  </div>
                </div>
              </div>

              <v-icon class="divider">mdi-slash-forward</v-icon>

              <div class="d-flex flex-column">
                <button 
                  class="clickable item-title" 
                  @click="itemTitlePressed(item)" 
                  @keydown.enter="itemTitlePressed(item)"
                  :class="{'lighter-black-color': hover}"
                  :aria-label="`${item.isCollection ? `open modal with details about ${item.primaryLabel}` : `play ${item.primaryLabel} by ${item.secondaryLabel}`}`"
                >
                  {{item.primaryLabel}}
                </button>

                <span class="item-detail">{{item.secondaryLabel}}</span>
                <div class="item-detail"><v-icon v-if="item.numberOfTracks" class="record-icon">mdi-music-circle</v-icon>{{item.numberOfTracks}}</div>
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
  import {PLAYBACK_QUEUE} from '~/store/constants';
  import {activityTimestamp} from '~/utils/helpers';

  @Component
  export default class VerticalContent extends Vue {
    activityTimestamp = activityTimestamp;

    @Prop({required: true})
    data;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;

    displayItemDetails(item){
      this.$nuxt.$root.$emit('displayDetailOverlay', item);
    }

    async itemTitlePressed(item){
      if(item.isCollection){
        this.displayItemDetails(item);
      }
      else{
        await this.playTrackNow(item);
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
      align-items: center;
      padding: $base-padding $base-padding 8px;

      @media(max-width: $max-inner-width){ 
        align-items: flex-start;
      }

      .divider {
        font-size: 32px;
        color: $primary-theme-color;
        margin-left: 8px;
      }

      .item-title {
        font-size: 22px;
        line-height: 1.3;
        padding-bottom: 2px;
        font-weight: bold;
        word-break: break-word;
        text-align: left;
      }
    }
    
    .item-detail {
      font-size: 14px;
      padding-bottom: 2px;
      display: flex;
      align-items: center;
      font-weight: bold;
      color: #888888;
      word-break: break-word;
    }
  }

  .bottom-left-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
    width: 100%;
    margin-top: 8px;

    .time-ago {
      font-size: 14px;
      padding-left: 6px;
      font-weight: bold;
      color: #888888;
    }
  }

  .left-item-container {
    display: flex;
    flex-direction: column;
    max-width: 50%;
  }
</style>