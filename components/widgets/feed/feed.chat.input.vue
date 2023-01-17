<template>    
  <section class="mt-3 mb-2">
    <v-text-field 
      dense 
      outlined 
      placeholder="Track talk..." 
      :hide-details="true" 
      class="feed-chat-input" 
      :class="{'vertically-hidden': !showReactions, 'chat-input-on-white': chatOnFeedAlert}"
      :color="color"
      width="85%"
      @keyup.enter="chatMessageSubmitted"
      v-model="chatMessage"
      clearable
      :maxlength="100"
    >
      <template v-slot:append-outer>
        <v-icon :color="submitIconColor" class="clickable mr-2" @click.stop="chatMessageSubmitted()">mdi-arrow-up-circle</v-icon>
        
        <div class="reaction-container" v-if="!chatOnFeedAlert">
          <div class="clickable reaction" :class="{'pt-1': index == 1}" v-for="(reaction, index) in reactions" :key="reaction.name" @click.stop="emojiReactionPressed(reaction.code)">{{String.fromCodePoint(reaction.code)}}</div>
        </div>
      </template>
    </v-text-field>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {FEED} from '~/store/constants';

  @Component
  export default class FeedChatInput extends Vue {
    chatMessage = '';

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

    @Prop({default: true})
    showReactions;

    @Prop({default: 'white'})
    color;

    @Prop()
    chatOnFeedAlert;

    @Prop({default: 'white'})
    submitIconColor;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    chatMessageSubmitted(){
      if(this.chatMessage.trim()){
        this.addReactionToActivity({activity: this.activity, message: this.chatMessage});
        this.handleFeedAlert();
        this.chatMessage = '';
      }
    }

    emojiReactionPressed(code){
      const message = String.fromCodePoint(code);
      this.addReactionToActivity({activity: this.activity, message});
      this.handleFeedAlert(message);
      this.chatMessage = '';
      this.$forceUpdate();
    }

    handleFeedAlert(message){
      if(this.chatOnFeedAlert){
        this.$nuxt.$root.$emit('feedAlertChatSubmitted', message || this.chatMessage);
      }
    }
  }
</script>

<style lang="scss">
  .feed-chat-input {    
    font-size: $chat-font-size;
    align-items: center;

    fieldset {
      border-color: white;
    }

    ::placeholder {
      color: white !important;
    }

    input {
      font-weight: bold;
      color: white !important;
    }

    .v-input__append-outer, .v-input__append-inner {
      margin-top: 4px !important;
    }

    .reaction-container {
      display: flex;
      align-items: center;

      .reaction {
        font-size: 18px;
        margin: 0px $reaction-emoji-margin;
      }
    }
  }

  .chat-input-on-white {
    fieldset {
      border-color: black;
    }

    input {
      color: black !important;
    }

    ::placeholder {
      color: rgba(0, 0, 0, 0.8) !important;
    }
  }
</style>