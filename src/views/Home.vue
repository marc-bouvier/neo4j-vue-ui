<template>
    <div>
        <h1>Hi {{user.firstName}}!</h1>
        <p>You're logged in with Vue.js & Basic HTTP Authentication!!</p>
  
        
        <p>
            <router-link to="/login">Logout</router-link>
        </p>
    </div>
</template>

<script>

export default {
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