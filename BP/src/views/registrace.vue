<template>
  <div class="HeadingStrip">
    <h1>Registrace</h1>
  </div>
  <div class="registration-container">
    <div class="registration-content">
      <p class="intro-text">
        Vytvořte si účet pro sledování objednávek a rychlejší nákupy. Registrace zabere jen několik
        minut.
      </p>

      <div class="registration-options">
        <!-- Hlavní registrační formulář -->
        <form @submit.prevent="submitRegistration" class="registration-form" v-if="!formSubmitted">
          <div class="form-section">
            <h3>Osobní údaje</h3>

            <div class="form-row">
              <div class="form-group half">
                <label for="firstName">Jméno *</label>
                <input
                  type="text"
                  id="firstName"
                  v-model="registrationData.firstName"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group half">
                <label for="lastName">Příjmení *</label>
                <input
                  type="text"
                  id="lastName"
                  v-model="registrationData.lastName"
                  required
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="companyName">Název firmy (nepovinné)</label>
              <input
                type="text"
                id="companyName"
                v-model="registrationData.companyName"
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="email">E-mail *</label>
                <input
                  type="email"
                  id="email"
                  v-model="registrationData.email"
                  required
                  class="form-input"
                />
              </div>
              <div class="form-group half">
                <label for="phone">Telefon *</label>
                <input
                  type="tel"
                  id="phone"
                  v-model="registrationData.phone"
                  required
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Heslo</h3>

            <div class="form-group password-group">
              <label for="password">Heslo *</label>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="registrationData.password"
                required
                class="form-input"
              />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
              <div class="password-strength" v-if="registrationData.password">
                <div class="strength-meter">
                  <div
                    class="strength-value"
                    :style="{ width: passwordStrength + '%', backgroundColor: strengthColor }"
                  ></div>
                </div>
                <span class="strength-text">{{ strengthText }}</span>
              </div>
              <div class="password-hints">
                <small>Heslo musí obsahovat minimálně 8 znaků, včetně písmen a číslic.</small>
              </div>
            </div>

            <div class="form-group password-group">
              <label for="confirmPassword">Potvrdit heslo *</label>
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                v-model="registrationData.confirmPassword"
                required
                class="form-input"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
              <div
                class="password-match"
                v-if="registrationData.password && registrationData.confirmPassword"
              >
                <span
                  class="match-text"
                  :class="{ 'match-ok': passwordsMatch, 'match-error': !passwordsMatch }"
                >
                  {{ passwordsMatch ? '✓ Hesla se shodují' : '✗ Hesla se neshodují' }}
                </span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Adresa (nepovinné)</h3>

            <div class="form-group">
              <label for="street">Ulice a číslo</label>
              <input type="text" id="street" v-model="registrationData.street" class="form-input" />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="city">Město</label>
                <input type="text" id="city" v-model="registrationData.city" class="form-input" />
              </div>
              <div class="form-group half">
                <label for="zipCode">PSČ</label>
                <input
                  type="text"
                  id="zipCode"
                  v-model="registrationData.zipCode"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Souhlas s podmínkami</h3>

            <div class="form-group checkbox-group">
              <div class="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="terms"
                  v-model="registrationData.termsAccepted"
                  required
                />
                <label for="terms">
                  Souhlasím s
                  <a href="#" @click.prevent="showTermsModal">obchodními podmínkami</a> *
                </label>
              </div>
            </div>

            <div class="form-group checkbox-group">
              <div class="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="privacy"
                  v-model="registrationData.privacyAccepted"
                  required
                />
                <label for="privacy">
                  Souhlasím se
                  <a href="#" @click.prevent="showPrivacyModal">zpracováním osobních údajů</a> *
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="submit-button" :disabled="isSubmitting || !formValid">
              <span v-if="!isSubmitting">Vytvořit účet</span>
              <span v-else>Registruji...</span>
            </button>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          <p class="form-note">* Povinné údaje</p>
        </form>

        <!-- Potvrzení úspěšné registrace -->
        <div v-if="formSubmitted" class="success-message">
          <div class="success-content">
            <h3>Registrace byla úspěšná!</h3>
            <p>
              Na váš e-mail jsme zaslali potvrzení. Pro dokončení registrace prosím klikněte na
              odkaz v e-mailu.
            </p>
            <p class="success-note">
              Po potvrzení registrace se budete moci přihlásit pomocí zadaných údajů.
            </p>
            <router-link to="/prihlaseni" class="back-button"> Přejít na přihlášení </router-link>
          </div>
        </div>

        <!-- Separator pro sociální registraci -->
        <div class="social-separator" v-if="!formSubmitted">
          <span>nebo</span>
        </div>

        <!-- Registrace přes Google -->
        <div class="social-login" v-if="!formSubmitted">
          <button @click="registerWithGoogle" class="google-button" :disabled="isSubmitting">
            <span class="google-icon">G</span>
            <span>Registrovat přes Google</span>
          </button>
        </div>
      </div>

      <!-- Sekce pro již registrované uživatele -->
      <div class="login-section" v-if="!formSubmitted">
        <h3>Již máte účet?</h3>
        <p>Pokud jste již zaregistrovaní, můžete se přihlásit ke svému účtu.</p>
        <router-link to="/prihlaseni" class="login-button"> Přihlásit se </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_URL from '@/config/api.js';

export default {
  name: 'RegistrationPage',
  data() {
    return {
      registrationData: {
        firstName: '',
        lastName: '',
        companyName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        street: '',
        city: '',
        zipCode: '',
        termsAccepted: false,
        privacyAccepted: false,
        marketingAccepted: false
      },
      isSubmitting: false,
      formSubmitted: false,
      errorMessage: '',
      showPassword: false,
      showConfirmPassword: false
    }
  },
  computed: {
    // Výpočet síly hesla (jednoduchá ukázka)
    passwordStrength() {
      const password = this.registrationData.password
      if (!password) return 0

      let strength = 0

      // Délka hesla
      if (password.length >= 8) strength += 25

      // Obsahuje malá písmena
      if (/[a-z]/.test(password)) strength += 25

      // Obsahuje velká písmena
      if (/[A-Z]/.test(password)) strength += 25

      // Obsahuje číslice
      if (/\d/.test(password)) strength += 25

      return strength
    },

    // Barva indikátoru síly hesla
    strengthColor() {
      const strength = this.passwordStrength
      if (strength < 50) return '#ff4d4d' // Červená
      if (strength < 75) return '#ffa64d' // Oranžová
      return '#4CAF50' // Zelená
    },

    // Text popisující sílu hesla
    strengthText() {
      const strength = this.passwordStrength
      if (strength < 50) return 'Slabé'
      if (strength < 75) return 'Středně silné'
      return 'Silné'
    },

    // Kontrola shody hesel
    passwordsMatch() {
      return this.registrationData.password === this.registrationData.confirmPassword
    },

    // Validace formuláře před odesláním
    formValid() {
      // Základní validace - kontrola povinných polí a shody hesel
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        termsAccepted,
        privacyAccepted
      } = this.registrationData

      return (
        firstName.trim() !== '' &&
        lastName.trim() !== '' &&
        email.trim() !== '' &&
        phone.trim() !== '' &&
        phone.length <= 20 && // Přidáno - kontrola délky telefonního čísla
        password.trim() !== '' &&
        password === confirmPassword &&
        password.length >= 8 &&
        termsAccepted &&
        privacyAccepted
      )
    }
  },
  methods: {
    async submitRegistration() {
      // Kontrola validace formuláře
      if (!this.formValid) {
        this.errorMessage = 'Vyplňte prosím všechna povinná pole a zkontrolujte heslo.'
        return
      }

      // Nastavení indikátoru odesílání a resetování chybové zprávy
      this.isSubmitting = true
      this.errorMessage = ''

      try {
        // Příprava dat pro odeslání - bez potvrzení hesla
        const registrationPayload = {
          firstName: this.registrationData.firstName,
          lastName: this.registrationData.lastName,
          email: this.registrationData.email,
          password: this.registrationData.password,
          phone: this.registrationData.phone,
          companyName: this.registrationData.companyName,
          street: this.registrationData.street,
          city: this.registrationData.city,
          zipCode: this.registrationData.zipCode,
          termsAccepted: this.registrationData.termsAccepted,
          privacyAccepted: this.registrationData.privacyAccepted,
          marketingAccepted: this.registrationData.marketingAccepted
        }

        // Odeslání registračních údajů na local backend
        const response = await axios.post(`${API_URL}/api/register`, registrationPayload)

        // Zpracování úspěšné odpovědi ze serveru
        console.log('Odpověď serveru:', response.data)

        this.formSubmitted = true
      } catch (error) {
        // Zpracování chyby z API
        console.error('Chyba při registraci:', error)

        if (error.response && error.response.data && error.response.data.error) {
          // Zobrazení konkrétní chybové zprávy ze serveru
          this.errorMessage = error.response.data.error
        } else {
          // Obecná chybová zpráva
          this.errorMessage = 'Nepodařilo se dokončit registraci. Zkuste to prosím znovu později.'
        }
      } finally {
        this.isSubmitting = false
      }
    },

    registerWithGoogle() {
      // Zde by byla implementace registrace přes Google OAuth
      // Pro kompletní implementaci je potřeba využít knihovnu jako je vue-google-oauth2

      // Příklad implementace s využitím Google OAuth knihovny:
      // this.$gAuth.signIn().then(googleUser => {
      //   const idToken = googleUser.getAuthResponse().id_token
      //   return axios.post(`${import.meta.env.VITE_API_URL}/api/register/google`, { token: idToken })
      // }).then(response => {
      //   this.formSubmitted = true
      // }).catch(error => {
      //   console.error('Google register error:', error)
      //   this.errorMessage = 'Registrace přes Google se nezdařila. Zkuste to prosím znovu.'
      // })

      // Simulace pro ukázku
      this.isSubmitting = true
      setTimeout(() => {
        this.isSubmitting = false
        this.formSubmitted = true
      }, 1000)
    },

    showTermsModal() {
      // Zobrazení modálního okna s obchodními podmínkami
      alert('Zde by se zobrazily obchodní podmínky.')
    },

    showPrivacyModal() {
      // Zobrazení modálního okna se zásadami ochrany osobních údajů
      alert('Zde by se zobrazily zásady ochrany osobních údajů.')
    }
  }
}
</script>

<style scoped>
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

.registration-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.registration-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 30px;
}

.intro-text {
  font-size: 18px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 30px;
  text-align: center;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.registration-options {
  max-width: 800px;
  margin: 0 auto 40px;
}

.registration-form {
  width: 100%;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.form-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.half {
  flex: 1 1 calc(50% - 10px);
  min-width: 250px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #f5852a;
  box-shadow: 0 0 0 2px rgba(245, 133, 42, 0.2);
}

.password-group {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 15px;
  top: 38px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #777;
}

.password-strength {
  margin-top: 8px;
}

.strength-meter {
  height: 5px;
  background-color: #eee;
  border-radius: 3px;
  margin-bottom: 5px;
}

.strength-value {
  height: 100%;
  border-radius: 3px;
  transition:
    width 0.3s,
    background-color 0.3s;
}

.strength-text {
  font-size: 12px;
  color: #777;
}

.password-hints {
  margin-top: 5px;
  font-size: 12px;
  color: #777;
}

.password-match {
  margin-top: 8px;
}

.match-text {
  font-size: 14px;
}

.match-ok {
  color: #4caf50;
}

.match-error {
  color: #ff4d4d;
}

.checkbox-group {
  margin-top: 5px;
  margin-bottom: 15px;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
}

.checkbox-wrapper input[type='checkbox'] {
  margin-top: 3px;
  margin-right: 10px;
}

.checkbox-wrapper label {
  font-weight: normal;
  margin-bottom: 0;
  font-size: 14px;
  color: #555;
}

.checkbox-wrapper a {
  color: #f5852a;
  text-decoration: none;
}

.checkbox-wrapper a:hover {
  text-decoration: underline;
}

.submit-button {
  background-color: #f5852a;
  color: white;
  border: none;
  padding: 14px 30px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  margin-top: 10px;
}

.submit-button:hover {
  background-color: #e67722;
}

.submit-button:disabled {
  background-color: #f8b47e;
  cursor: not-allowed;
}

.error-message {
  color: #e63946;
  text-align: center;
  margin-top: 15px;
  font-weight: 500;
}

.form-note {
  font-size: 14px;
  color: #888;
  margin-top: 15px;
  text-align: center;
}

.success-message {
  max-width: 600px;
  margin: 0 auto;
}

.success-content {
  padding: 30px;
  background-color: #f0f8e5;
  border-radius: 8px;
  text-align: center;
}

.success-content h3 {
  color: #4caf50;
  font-size: 24px;
  margin-bottom: 15px;
}

.success-content p {
  margin-bottom: 15px;
  font-size: 16px;
  line-height: 1.6;
}

.success-note {
  font-size: 14px;
  color: #555;
  margin-bottom: 25px;
}

.back-button {
  display: inline-block;
  background-color: #555;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #333;
}

.social-separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 25px 0;
  color: #777;
}

.social-separator::before,
.social-separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.social-separator span {
  padding: 0 10px;
}

.social-login {
  margin-bottom: 25px;
}

.google-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.google-button:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.google-button:disabled {
  background-color: #f5f5f5;
  border-color: #eee;
  color: #aaa;
  cursor: not-allowed;
}

.google-icon {
  background-color: #fff;
  color: #4285f4;
  font-weight: bold;
  font-size: 18px;
  margin-right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.login-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #eee;
  text-align: center;
}

.login-section h3 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #333;
}

.login-section p {
  color: #555;
  margin-bottom: 25px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.login-button {
  display: inline-block;
  background-color: #555;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #333;
}

/* Responsivní design */
@media (max-width: 768px) {
  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

@media (max-width: 576px) {
  .registration-content {
    padding: 20px;
  }

  .intro-text {
    font-size: 16px;
  }

  h1 {
    font-size: 28px;
    margin: 40px auto 30px auto;
  }

  .HeadingStrip {
    height: 100px;
  }

  .form-section h3 {
    font-size: 18px;
  }
}
</style>
