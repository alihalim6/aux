<template>    
  <section class="feed-item-container">
    <v-img class="clickable track-img" :src="activity.track.imgUrl.small" @click.stop="displayDetailOverlays(activity.track)"></v-img>

    <div class="feed-item fill-available">
      <div class="item-info-container">
        <div class="item-info">
          <div class="d-flex align-center" @click="itemInfoPressed(activity.track)">
            <span class="clickable font-weight-bold" :class="{'transparent-bg-track-playing-color': trackIsPlaying(activity.track)}">{{activity.track.primaryLabel}} /<span class="track-artists"> {{activity.track.secondaryLabel}}</span></span>
          </div>
        </div>

        <div class="activity-info-container">
          <div class="clickable added-by">
            <!-- TODO followability (if not you)-->
            <v-img v-if="activity.user.img" :src="activity.user.img" class="round-img-icon"></v-img>
            <span :class="{'username-margin': activity.user.img}">{{activity.addedByCurrentUser ? 'You' : activity.user.name}}</span>
          </div>

          <timeago :datetime="activity.timestamp" :auto-update="true" class="font-weight-regular"></timeago>
        </div>

        <div class="d-flex flex-column">
          <div class="reaction-activity-container" :class="{'vertically-hidden': !showReactions, 'scroll-shadow-on-transparent': activity.reactions && activity.reactions.length >= 5}">
            <span v-for="(reaction, index) in activity.reactions" :key="index">
              <span class="font-weight-bold mr-1">{{reaction.author}}:</span>
              <span class="mr-1">{{reaction.message}}</span>
            </span>
          </div>

          <ActivityChatInput :activity="activity" :showReactions="showReactions"/>
        </div>
      </div>
    </div>

    <div class="d-flex flex-column align-end">
      <ThreeDotIcon :item="activity.track" icon-class="activity-item-three-dot"/>

      <div class="clickable reaction-toggle-container">
        <v-icon color="white" small @click.stop="() => showReactions = !showReactions">mdi-chat-outline</v-icon>
        <span v-if="activity.reactions && activity.reactions.length" class="reaction-count">{{activity.reactions.length}}</span>
      </div>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action, Getter, Mutation} from 'nuxt-property-decorator';
  import {UI, FEED, PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
  import {differenceInMinutes, differenceInHours} from 'date-fns';
  import {isSameTrack} from '~/utils/helpers';

  @Component
  export default class ActivityItem extends Vue {
    chatMessage = '';
    showReactions = false;

    reactions = [
      {
        code: 0x1F525,
        name: 'fire'
      },
      {
        code: 0x1F612,
        name: 'nah'
      }
    ];

    @Prop()
    activity;

    @Prop()
    itemSet;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;
    
    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

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

    //TODO: unused, remove logic where activity added
    reactionTimestamp(date){
      const hourOrMoreAgo = differenceInHours(new Date(), date);

      if(hourOrMoreAgo){
        return `${hourOrMoreAgo}h`;
      }

      const minutesAgo = differenceInMinutes(new Date(), date);
      return `${minutesAgo < 1 ? 'just now' : `${minutesAgo}m`}`;
    }

    async itemInfoPressed(track){
      if(this.trackIsPlaying(track)){
        await this.togglePlayback({item: track});
      }
      else{
        this.playTrackNow(track);
      }
    }

    trackIsPlaying(track){
      return isSameTrack(track, this.currentlyPlayingItem);
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';

  .feed-item-container {
    display: flex;
    align-items: flex-start;
    justify-content: space-around;
    margin-bottom: 24px;

    .track-img {
      $track-img-size: 28px;

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

        .item-info {
          display: -webkit-inline-box;
          flex-wrap: wrap;
          padding-bottom: 6px;
          margin-bottom: 6px;

          .track-artists {
            font-weight: normal;
            font-size: 12px;
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
          margin-bottom: 2px;

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
      font-size: 12px;
      margin-left: 4px;
      padding-bottom: 2px;
    }
  }
</style>