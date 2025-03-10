<template>
  <div class="verification-container">
    <div class="HeadingStrip">
      <h1>Ověření e-mailu</h1>
    </div>

    <div class="content-container">
      <div v-if="loading" class="loading">
        <p>Ověřování vašeho e-mailu...</p>
      </div>

      <div v-else-if="verified" class="success">
        <div class="success-icon">✓</div>
        <h2>E-mail byl úspěšně ověřen!</h2>
        <p>Nyní se můžete přihlásit do svého účtu.</p>
        <router-link to="/prihlaseni" class="button">Přejít na přihlášení</router-link>
      </div>

      <div v-else class="error">
        <div class="error-icon">✗</div>
        <h2>Ověření se nezdařilo</h2>
        <p>{{ errorMessage }}</p>
        <router-link to="/registrace" class="button">Registrovat se znovu</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'overeniMailu',
  data() {
    return {
      loading: true,
      verified: false,
      errorMessage: 'Odkaz pro ověření je neplatný nebo vypršel.'
    }
  },
  mounted() {
    this.verifyEmail()
  },
  methods: {
    async verifyEmail() {
      try {
        const token = this.$route.params.token
        if (!token) {
          this.loading = false
          return
        }

        const response = await axios.get(`http://localhost:5000/api/verify-email/${token}`)

        this.verified = true
        this.loading = false
      } catch (error) {
        this.verified = false
        this.loading = false

        if (error.response && error.response.data && error.response.data.error) {
          this.errorMessage = error.response.data.error
        }
      }
    }
  }
}
</script>

<style scoped>
.verification-container {
  font-family: Arial, sans-serif;
}

.HeadingStrip {
  width: 100%;
  height: 150px;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

h1 {
  color: #0e0e0e;
  margin: 100px auto 80px auto;
  text-align: center;
  font-size: 42px;
}

.content-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading,
.success,
.error {
  padding: 20px;
}

.success-icon,
.error-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success-icon {
  color: #4caf50;
}

.error-icon {
  color: #e63946;
}

h2 {
  font-size: 28px;
  margin-bottom: 15px;
}

p {
  font-size: 18px;
  color: #555;
  margin-bottom: 25px;
}

.button {
  display: inline-block;
  background-color: #f5852a;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #e67722;
}

@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }
}
</style>
