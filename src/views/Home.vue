<template>
    <div>
        <h1>Hi {{user.firstName}}!</h1>
        <p>You're logged in with Vue.js & Basic HTTP Authentication!!</p>
  
        <node-creator></node-creator>
        <p>
            <router-link to="/login">Logout</router-link>
        </p>
    </div>
</template>

<script>
import NodeCreator from '../components/NodeCreator.vue'
export default {
    components:{NodeCreator},
    data () {
        return {
            user: {},
            users: []
        }
    },
    created () {
        this.user = JSON.parse(localStorage.getItem('user'));

    }
};
</script>