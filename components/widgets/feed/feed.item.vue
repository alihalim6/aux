<template>    
  <section class="feed-item-container">
    <v-img 
      class="clickable track-img" 
      v-if="activity.track.imgUrl" 
      :src="activity.track.imgUrl.small || activity.track.imgUrl.large" 
      :class="{'skipped': skippedNotPlayed()}" 
      @click.stop="trackImgPressed()"
      @keyup.enter="trackImgPressed()"
      tabindex="0"
      :alt="`open modal with details about ${activity.track.primaryLabel}`"
    >
    </v-img>

    <div class="feed-item fill-available">
      <div class="item-info-container" :class="{'mb-6': skippedNotPlayed()}">
        <div class="track-info" :class="{'skipped': skippedNotPlayed()}">
          <div class="d-flex align-center"
            @click="itemInfoPressed(activity.track)"
            @keyup.enter="itemInfoPressed(activity.track)"
            tabindex="0"
            :class="{'track-playing font-italic': !activity.splash && isTrackPlaying(activity.track)}"
            :aria-label="`play ${activity.track.primaryLabel} by ${activity.track.secondaryLabel} ${skippedNotPlayed() ? '(track was previously skipped)' : ''}`"
          >
            <span class="clickable font-weight-bold" aria-hidden="true">{{activity.track.primaryLabel}} /<span class="track-artists"> {{activity.track.secondaryLabel}}</span></span>
          </div>
          
          <v-progress-linear 
            v-if="(!activity.skipped && !activity.played) || (activity.skipped && isTrackPlaying(activity.track))" 
            class="aux-play-pending" 
            stream 
            reverse 
            color="white" 
            :buffer-value="0">
          </v-progress-linear>
        </div>

        <section v-if="activity.played">
          <div class="activity-info-container">
            <div class="added-by" :aria-label="`track added by ${addedBy()}`">
              <v-img v-if="activity.user.img" :src="activity.user.img" class="round-img-icon" alt=""></v-img>
              <span :class="{'username-margin': activity.user.img}" aria-hidden="true">{{addedBy()}}</span>
            </div>

            <timeago :datetime="activity.timestamp" :converter="activityTimestamp" :auto-update="true" class="font-weight-regular"></timeago>
          </div>

          <div class="d-flex flex-column" :class="{'vertically-hidden': !showReactions}">
            <div :id="`${activity.queueId}-reactions`" class="reaction-activity-container" :class="{'vertically-hidden': !showReactions}">
              <span v-for="reaction in activity.reactions" :key="reaction.timestamp.toString()">
                <span class="reaction-author" :aria-label="`commenter username: ${reaction.author}`">{{reaction.author}}:</span>
                <span role="comment" class="mr-1">{{reaction.message}}</span>
              </span>
            </div>

            <FeedChatInput :activity="activity" />
          </div>
        </section>
      </div>
    </div>

    <div class="d-flex flex-column align-end margin-left-auto" :class="{'no-visibility': !activity.played}">
      <ThreeDotIcon v-if="!activity.splash" :item="activity.track" icon-class="activity-item-three-dot"/>

      <div class="clickable reaction-toggle-container" 
        @click.stop="toggleReactions()" 
        @keyup.enter="toggleReactions()" 
        tabindex="0" 
        :aria-label="`toggle comments/reactions for ${activity.track.primaryLabel} (${activity.reactions ? activity.reactions.length : 0} comments currently ${showReactions ? 'showing' : 'hidden'})`"
      >
        <v-icon color="white" small>{{`mdi-chat${activity.reactions && activity.reactions.length ? '' : '-outline'}`}}</v-icon>
        <span v-if="activity.reactions && activity.reactions.length" class="reaction-count" aria-hidden="true">{{activity.reactions.length}}</span>
      </div>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action, Getter, Mutation, Watch} from 'nuxt-property-decorator';
  import {UI, PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
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

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;
    
    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Mutation('setToast', {namespace: UI})
    setToast;

    @Watch('trackIsPlaying')
    trackIsPlayingChanged(newValue, oldValue){
      //show reactions for track playing and close the rest
      this.showReactions = newValue && !oldValue;
    }

    async itemInfoPressed(track){
      if(this.activity.splash){
        this.setToast({text: 'Gotta be logged in to play music!'});
        return;
      }
      
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

    trackImgPressed(){
      if(this.activity.splash){
        this.setToast({text: 'Gotta be logged in to see track info!'});
      }
      else{
        this.$nuxt.$root.$emit('displayDetailOverlay', this.activity.track);
      }
    }

    skippedNotPlayed(){
      return this.activity.skipped && !this.activity.played;
    }

    toggleReactions(){
      this.showReactions = !this.showReactions;
    }

    addedBy(){
      return this.activity.addedByCurrentUser ? 'You' : this.activity.user.name;
    }
  }
</script>

<style lang="scss">  
  .feed-item-container {
    display: flex;
    align-items: flex-start;
    margin-bottom: 48px;

    .track-img {
      $track-img-size: 32px;

      max-width: $track-img-size;
      height: $track-img-size;
      margin-right: 18px;
      align-self: baseline;
      margin-top: 3px;
    }

    .feed-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
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
          display: flex;
          flex-direction: column;
          margin-top: 18px;
          font-size: $chat-font-size;
          color: white;
          padding: 6px 0px;

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
          color: $cream;
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
    text-decoration: line-through;
  }

  .reaction-author {
    color: #fffbcc;
    font-weight: bold;
    margin-right: 4px;
  }
</style>