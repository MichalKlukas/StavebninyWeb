<template>
  <div class="auth-debug">
    <h2>Authentication Debug</h2>
    <div><strong>User:</strong> {{ userStore.user?.email || 'Not logged in' }}</div>
    <div><strong>Token exists:</strong> {{ !!userStore.token }}</div>
    <div><strong>Is Logged In:</strong> {{ userStore.isLoggedIn }}</div>
    <button @click="checkToken">Check Token</button>
    <pre v-if="tokenInfo">{{ tokenInfo }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()
const tokenInfo = ref(null)

const checkToken = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  tokenInfo.value = {
    token: token ? `${token.substring(0, 15)}...` : 'MISSING',
    user: user ? JSON.parse(user) : 'MISSING',
    localStorage: Object.keys(localStorage)
  }
}
</script>
