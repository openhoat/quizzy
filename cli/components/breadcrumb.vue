<template>
  <ol class="breadcrumb">
    <li><a :title="$t('home')" href="#/">{{ $t('home') }}</a></li>
    <li v-for="item in breadcrumb" :class="currentPage(item.path) && 'active'">
      <span v-if="currentPage(item.path)">{{ item.title }}</span>
      <router-link :to="item.path" v-else>
        <a :title="item.title">{{ item.title }}</a>
      </router-link>
    </li>
  </ol>
</template>

<script type="text/ecmascript-6">
  export default {
    data() {
      return {
        breadcrumb: null,
      }
    },
    methods: {
      currentPage(path) {
        return _.first(this.$route.path.split('?')) === path
      },
      refreshBreadcrumb(to) {
        this.breadcrumb = _.compact(to.path.split('/'))
            .map((item, index, routeItems) => ({
              title: _.capitalize(item),
              path: '/' + routeItems.slice(0, index + 1).join('/')
            }))
      },
    },
    created(){
      this.$router.beforeEach((to, from, next) => {
        this.refreshBreadcrumb(to)
        next()
      })
      this.refreshBreadcrumb(this.$route)
    }
  }
</script>