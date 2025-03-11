import API_URL from '@/config/api.js';
<template>
  <div class="HeadingStrip">
    <h1>Poptávka</h1>
  </div>
  <div class="inquiry-container">
    <div class="inquiry-content">
      <p class="intro-text">
        Máte zájem o konkrétní materiál nebo službu? Vyplňte prosím následující formulář a my vám co
        nejdříve zašleme cenovou nabídku. Náš tým odborníků je připraven vám pomoci s výběrem
        nejvhodnějšího řešení pro váš projekt.
      </p>

      <form @submit.prevent="submitForm" class="inquiry-form">
        <div class="form-group">
          <label for="name">Jméno a příjmení / Název firmy *</label>
          <input type="text" id="name" v-model="formData.name" required class="form-input" />
        </div>

        <div class="form-row">
          <div class="form-group half">
            <label for="email">E-mail *</label>
            <input type="email" id="email" v-model="formData.email" required class="form-input" />
          </div>
          <div class="form-group half">
            <label for="phone">Telefon *</label>
            <input type="tel" id="phone" v-model="formData.phone" required class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label for="address">Adresa</label>
          <input type="text" id="address" v-model="formData.address" class="form-input" />
        </div>

        <div class="form-group">
          <label for="subject">Předmět poptávky *</label>
          <input
            type="text"
            id="subject"
            v-model="formData.subject"
            required
            class="form-input"
            placeholder="Např. Stavební materiál, Izolace, Doprava materiálu..."
          />
        </div>

        <div class="form-group">
          <label for="message">Podrobnosti poptávky *</label>
          <textarea
            id="message"
            v-model="formData.message"
            required
            class="form-textarea"
            rows="6"
            placeholder="Popište prosím co nejpodrobněji vaši poptávku včetně množství, termínů a dalších požadavků..."
          ></textarea>
        </div>

        <div class="form-group checkbox-group">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="terms" v-model="formData.terms" required />
            <label for="terms"
              >Souhlasím se
              <a href="#" @click.prevent="showTerms">zpracováním osobních údajů</a> *</label
            >
          </div>
        </div>

        <div class="form-group">
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            <span v-if="!isSubmitting">Odeslat poptávku</span>
            <span v-else>Odesílání...</span>
          </button>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p class="form-note">* Povinné údaje</p>
      </form>

      <div v-if="formSubmitted" class="success-message">
        <div class="success-content">
          <h3>Děkujeme za Vaši poptávku!</h3>
          <p>
            Vaše zpráva byla úspěšně odeslána. Budeme vás kontaktovat co nejdříve, obvykle do 1-2
            pracovních dnů.
          </p>
          <button @click="resetForm" class="back-button">Zpět na formulář</button>
        </div>
      </div>

      <div class="contact-info-section">
        <h2>Další možnosti kontaktu</h2>
        <div class="contact-methods">
          <div class="contact-method">
            <div class="icon">📞</div>
            <div class="method-details">
              <h3>Telefon</h3>
              <p>775 315 349</p>
              <p class="small">Po-Pá: 7:00-16:00, So: 7:00-12:00</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon">✉️</div>
            <div class="method-details">
              <h3>E-mail</h3>
              <p>stavebninybaroch@seznam.cz</p>
              <p class="small">Odpovíme vám do 24 hodin v pracovní dny</p>
            </div>
          </div>

          <div class="contact-method">
            <div class="icon">🏬</div>
            <div class="method-details">
              <h3>Osobně</h3>
              <p>Lysá nad Labem, Sokolovská 1143</p>
              <p class="small">Navštivte naši prodejnu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PoptavkaPage',
  data() {
    return {
      formData: {
        name: '',
        email: '',
        phone: '',
        address: '',
        subject: '',
        message: '',
        terms: false
      },
      isSubmitting: false,
      formSubmitted: false,
      errorMessage: ''
    }
  },
  methods: {
    async submitForm() {
      this.isSubmitting = true
      this.errorMessage = ''

      try {
        // Odeslání dat na backend endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/contact`,
          this.formData
        )

        // Zpracování úspěšné odpovědi
        console.log('Odpověď serveru:', response.data)
        this.formSubmitted = true
      } catch (error) {
        // Zpracování chyby
        console.error('Chyba při odesílání formuláře:', error)

        if (error.response && error.response.data && error.response.data.error) {
          // Zobrazení chybové zprávy ze serveru
          this.errorMessage = error.response.data.error
        } else {
          // Obecná chybová zpráva
          this.errorMessage =
            'Došlo k chybě při odesílání poptávky. Zkuste to prosím znovu později.'
        }
      } finally {
        this.isSubmitting = false
      }
    },
    resetForm() {
      this.formData = {
        name: '',
        email: '',
        phone: '',
        address: '',
        subject: '',
        message: '',
        terms: false
      }
      this.formSubmitted = false
      this.errorMessage = ''
    },
    showTerms() {
      alert('Zde by se zobrazily podmínky zpracování osobních údajů a GDPR informace.')
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

.inquiry-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.inquiry-content {
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

.inquiry-form {
  max-width: 800px;
  margin: 0 auto 40px;
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

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #f5852a;
  box-shadow: 0 0 0 2px rgba(245, 133, 42, 0.2);
}

.form-textarea {
  resize: vertical;
}

.checkbox-group {
  margin-top: 30px;
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
}

.success-message {
  max-width: 600px;
  margin: 0 auto;
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
  margin-bottom: 25px;
  font-size: 16px;
  line-height: 1.6;
}

.back-button {
  background-color: #555;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #333;
}

.contact-info-section {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid #eee;
}

.contact-info-section h2 {
  text-align: center;
  font-size: 28px;
  margin-bottom: 30px;
  color: #333;
}

.contact-methods {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 30px;
}

.contact-method {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  min-width: 250px;
  flex: 1;
}

.icon {
  font-size: 24px;
  margin-right: 15px;
}

.method-details h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.method-details p {
  margin: 0;
  color: #555;
}

.method-details .small {
  font-size: 14px;
  color: #888;
  margin-top: 5px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .contact-methods {
    flex-direction: column;
  }

  .contact-method {
    width: 100%;
  }

  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }
}
</style>
