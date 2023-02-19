<template>    
  <section class="feed-item-container">
    <v-img class="clickable track-img" v-if="activity.track.imgUrl" :src="activity.track.imgUrl.small || activity.track.imgUrl.large" :class="{'skipped': activity.skipped && !activity.played}" @click.stop="$nuxt.$root.$emit('displayDetailOverlay', activity.track)"></v-img>

    <div class="feed-item fill-available">
      <div class="item-info-container">
        <div class="track-info" :class="{'skipped': activity.skipped && !activity.played}">
          <div class="d-flex align-center" @click="itemInfoPressed(activity.track)" :class="{'track-playing': isTrackPlaying(activity.track)}">
            <span class="clickable font-weight-bold">{{activity.track.primaryLabel}} /<span class="track-artists"> {{activity.track.secondaryLabel}}</span></span>
          </div>
          
          <v-progress-linear v-if="(!activity.skipped && !activity.played) || (activity.skipped && isTrackPlaying(activity.track))" class="aux-play-pending" stream reverse color="white" :buffer-value="0"></v-progress-linear>
        </div>

        <section v-if="activity.played">
          <div class="activity-info-container">
            <div class="added-by">
              <v-img v-if="activity.user.img" :src="activity.user.img" class="round-img-icon"></v-img>
              <span :class="{'username-margin': activity.user.img}">{{activity.addedByCurrentUser ? 'You' : activity.user.name}}</span>
            </div>

            <timeago :datetime="activity.timestamp" :converter="activityTimestamp" :auto-update="true" class="font-weight-regular"></timeago>
          </div>

          <div class="d-flex flex-column">
            <div class="reaction-activity-container" :class="{'vertically-hidden': !showReactions, 'scroll-shadow-on-transparent': activity.reactions && activity.reactions.length >= 5}">
              <span v-for="reaction in activity.reactions" :key="reaction.timestamp.toString()">
                <span class="font-weight-bold mr-1">{{reaction.author}}:</span>
                <span class="mr-1">{{reaction.message}}</span>
              </span>
            </div>

            <FeedChatInput :activity="activity" :showReactions="showReactions"/>
          </div>
        </section>
      </div>
    </div>

    <div class="d-flex flex-column align-end" :class="{'no-visibility': !activity.played}">
      <ThreeDotIcon :item="activity.track" icon-class="activity-item-three-dot"/>

      <div class="clickable reaction-toggle-container">
        <v-icon color="white" small @click.stop="() => showReactions = !showReactions">{{`mdi-chat${activity.reactions && activity.reactions.length ? '' : '-outline'}`}}</v-icon>
        <span v-if="activity.reactions && activity.reactions.length" class="reaction-count">{{activity.reactions.length}}</span>
      </div>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action, Getter, Mutation, Watch} from 'nuxt-property-decorator';
  import {UI, FEED, PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
  import {isSameTrack, activityTimestamp} from '~/utils/helpers';

  @Component
  export default class FeedItem extends Vue {
    chatMessage = '';
    //when reactions are added, whole component remounts so ensure reactions stays showing
    showReactions = !!(this.activity.reactions && this.activity.reactions.length);

    trackIsPlaying = false;
    activityTimestamp = activityTimestamp;

    @Prop()
    activity;

    @Prop()
    itemSet;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;
    
    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Watch('trackIsPlaying')
    trackIsPlayingChanged(newValue, oldValue){
      //show reactions for track playing and close the rest
      this.showReactions = newValue && !oldValue;
    }
    
    chatMessageSubmitted(){
      if(this.chatMessage.trim()){
        this.addReactionToActivity({activity: this.activity, message: this.chatMessage});
        this.chatMessage = '';
      }
    }

    emojiReactionPressed(code){
      this.addReactionToActivity({activity: this.activity, message: String.fromCodePoint(code)});
      this.chatMessage = '';
      this.$forceUpdate();
    }

    async itemInfoPressed(track){
      if(this.isTrackPlaying(track)){
        await this.togglePlayback({item: track});
      }
      else{
        this.playTrackNow(track);
      }
    }

    isTrackPlaying(track){
      this.trackIsPlaying = isSameTrack(track, this.currentlyPlayingItem);
      return this.trackIsPlaying;
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';
  
  .feed-item-container {
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    margin-bottom: 16px;

    .track-img {
      $track-img-size: 32px;

      max-width: $track-img-size;
      height: $track-img-size;
      margin-right: 12px;
      align-self: baseline;
      margin-top: 3px;
    }

    .feed-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-right: 12px;
      max-width: 67%;
      padding-top: 6px;

      @media(min-width: 630px){
        max-width: 80%;
      }

      .item-info-container {
        font-weight: normal;
        font-size: 14px;
        margin-bottom: 6px;
        width: 100%;
        display: flex;
        flex-direction: column;

        .track-info {
          display: flex;
          align-items: center;
          margin-bottom: 6px;

          .track-artists {
            font-weight: normal;
            font-size: 12px;
          }

          .aux-play-pending {
            margin-left: 12px;
            margin-top: 4px;
            width: 28px;
            flex: none;
          }
        }

        .reaction-activity-container {
          overflow: scroll;
          display: flex;
          flex-direction: column;
          max-height: 83px;
          margin-top: 18px;
          font-size: $chat-font-size;
          color: white;

          .reaction-timestamp {
            font-weight: bold;
            color: white;
            font-size: 10px;
          }
        }
      }

      .activity-info-container {
        font-size: 12px;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        width: 100%;
        font-weight: bold;

        .added-by {
          display: flex;
          align-items: center;
          color: white;
          margin-bottom: 6px;

          .username-margin {
            margin-left: 6px;
          }
        }
      }
    }

    $reaction-toggle-margin: 14px;

    .reaction-toggle-container {
      display: flex;
      align-items: center;
      margin-right: $reaction-toggle-margin;
      margin-top: 12px;
    }

    .activity-item-play {
      color: white !important;
    }

    .activity-item-three-dot {
      color: white !important;
      padding: 0px 0px 0px 8px;
      margin: 4px calc(#{$reaction-toggle-margin} - 6px) 0px 12px;
    }

    .reaction-count {
      font-size: 14px;
      margin-left: 4px;
      padding-bottom: 2px;
    }
  }

  .skipped {
    opacity: 0.65;
    font-style: italic;
  }
</style>