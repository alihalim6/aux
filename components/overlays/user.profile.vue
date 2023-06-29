<template>
  <section v-if="profile">
    <v-dialog content-class="pa-0" :value="profile" width="83%" max-width="max-content" @click:outside="closeModal()" transition="v-fade-transition">
      <div class="profile">
        <v-icon class="clickable align-self-end" color="white" large @click="closeModal()" aria-label="close user profile modal">mdi-close</v-icon>
        <v-img :src="profile.img" class="profile-img"></v-img>
      </div>
    </v-dialog>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';

  @Component
  export default class UserProfile extends Vue {
    @Prop({required: true})
    profile;

    closeModal(){
      this.$nuxt.$emit('closeUserProfileModal');
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('closeUserProfileModal');
    }
  }
</script>

<style lang="scss" scoped>
 .profile {
   background-color: $rose-red;
   padding: 24px $base-padding;
   font-weight: bold;
   display: flex;
   flex-direction: column;
   justify-content: space-between;
   align-items: center;

   .profile-img {
     $size: 90%;

     border-radius: 100%;
     height: $size;
     width: $size;
     border: 8px solid $cream;
   }
 }
</style>