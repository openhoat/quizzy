<template>
  <div>
    <div v-if="user">
      <div class="row">
        <div class="col-xs-6 text-left"
             v-html="$t('loggedInWith', {email: user.email, provider: user.provider})">
        </div>
        <div class="col-xs-6 text-right">
          <a role="button" v-on:click="signout" :title="$t('signOut')" class="pull-right btn btn-danger btn-sm">
            {{ $t('signOut') }}
          </a>
        </div>
      </div>
    </div>
    <div v-else>
      {{ $t('notLogged') }}
    </div>
    <hr>
  </div>
</template>

<script type="text/ecmascript-6">
  import helper from '../helper'
  import store from '../store'
  export default {
    computed: {
      user: () => store.state.user,
    },
    methods: {
      signout: function () {
        helper.deleteCookies()
        store.commit('clearUser')
        this.$router && this.$router.push('/')
      }
    },
  }
</script>