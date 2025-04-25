import API_URL from '@/config/api.js';
<template>
  <div class="HeadingStrip">
    <h1>Často kladené otázky</h1>
  </div>
  <div class="faq-container">
    <div class="faq-list">
      <div v-for="(item, index) in faqItems" :key="index" class="faq-item">
        <div class="faq-question-row" @click="toggleAnswer(index)">
          <div class="faq-question">{{ item.question }}</div>
          <div class="faq-toggle">
            <span v-if="!item.isOpen">+</span>
            <span v-else>-</span>
          </div>
        </div>
        <div class="faq-answer" v-if="item.isOpen">
          <p>{{ item.answer }}</p>
        </div>
      </div>
    </div>

    <!-- Contact Form Section -->
    <div class="contact-section">
      <h2>Nenašli jste odpověď na svou otázku?</h2>
      <p class="contact-intro">
        Neváhejte nás kontaktovat níže. Rádi vám pomůžeme a odpovíme na vaše dotazy.
      </p>

      <form @submit.prevent="submitForm" class="contact-form" v-if="!formSubmitted">
        <div class="form-row">
          <div class="form-group">
            <label for="contact-name">Jméno a příjmení *</label>
            <input
              type="text"
              id="contact-name"
              v-model="formData.name"
              required
              class="form-input"
              placeholder="Jan Novák"
            />
          </div>
          <div class="form-group">
            <label for="contact-email">E-mail *</label>
            <input
              type="email"
              id="contact-email"
              v-model="formData.email"
              required
              class="form-input"
              placeholder="jan.novak@example.cz"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="contact-subject">Předmět *</label>
          <input
            type="text"
            id="contact-subject"
            v-model="formData.subject"
            required
            class="form-input"
            placeholder="Téma vašeho dotazu"
          />
        </div>

        <div class="form-group">
          <label for="contact-message">Váš dotaz *</label>
          <textarea
            id="contact-message"
            v-model="formData.message"
            required
            class="form-textarea"
            rows="5"
            placeholder="Popište nám prosím váš dotaz co nejpodrobněji..."
          ></textarea>
        </div>

        <div class="form-group checkbox-group">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="contact-terms" v-model="formData.terms" required />
            <label for="contact-terms">
              Souhlasím se <a href="#" @click.prevent="showTerms">zpracováním osobních údajů</a> *
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            <span v-if="!isSubmitting">Odeslat dotaz</span>
            <span v-else>Odesílání...</span>
          </button>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p class="form-note">* Povinné údaje</p>
      </form>

      <div v-if="formSubmitted" class="success-message">
        <h3>Děkujeme za Váš dotaz!</h3>
        <p>
          Vaše zpráva byla úspěšně odeslána. Odpovíme vám co nejdříve, obvykle do 24-48 hodin v
          pracovní dny.
        </p>
        <button @click="resetForm" class="back-button">Odeslat další dotaz</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FaqPage',
  data() {
    return {
      faqItems: [
        {
          question: 'Jaká je otevírací doba vašich poboček?',
          answer:
            'Naše pobočky jsou otevřeny od pondělí do pátku od 7:00 do 17:00, v sobotu od 7:00 do 12:00. V neděli a o povinných svátcích máme zavřeno. V zimním období(listopad - únor) od 7:00 do 16:00 a o víkendu od 7:00 do 11:00',
          isOpen: false
        },
        {
          question: 'Nabízíte dopravu materiálu?',
          answer:
            'Ano, nabízíme dopravu materiálu i s možností složení hydraulickou rukou. Cena dopravy se odvíjí od vzdálenosti a objemu objednávky. Pro více informací nás kontaktujte.',
          isOpen: false
        },
        {
          question: 'Je možné vrátit nepoužitý materiál?',
          answer:
            'Ano, nepoužitý a nepoškozený materiál v původním balení můžete standartně vrátit do 14 dnů od nákupu. Je nutné předložit doklad o koupi.',
          isOpen: false
        },
        {
          question: 'Poskytujete odborné poradenství?',
          answer:
            'Samozřejmě, naši odborníci vám rádi poradí s výběrem vhodného materiálu pro váš konkrétní projekt. Můžete nás navštívit osobně nebo nás kontaktovat telefonicky či e-mailem.',
          isOpen: false
        },
        {
          question: 'Nabízíte množstevní slevy?',
          answer:
            'Ano, při větších odběrech materiálu poskytujeme množstevní slevy. Konkrétní podmínky se liší podle typu zboží a objemu objednávky.',
          isOpen: false
        }
      ],
      formData: {
        name: '',
        email: '',
        subject: '',
        message: '',
        terms: false
      },
      isSubmitting: false,
      formSubmitted: false,
      errorMessage: ''
    }
  },
  mounted() {
    console.log('VITE_API_URL při načtení:', import.meta.env.VITE_API_URL)
    console.log('Current API URL being used:', import.meta.env.VITE_API_URL)
  },
  methods: {
    toggleAnswer(index) {
      this.faqItems[index].isOpen = !this.faqItems[index].isOpen
    },
    // Metoda pro přidání nové otázky (lze volat z nadřazené komponenty nebo přes tlačítko v administraci)
    addFaqItem(question, answer) {
      this.faqItems.push({
        question,
        answer,
        isOpen: false
      })
    },

    async submitForm() {
      this.isSubmitting = true
      this.errorMessage = ''

      try {
        // Odeslání dat na backend endpoint
        console.log('Odesílám na URL:', `${import.meta.env.VITE_API_URL}/api/contact`)
        console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
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
          this.errorMessage = 'Došlo k chybě při odesílání dotazu. Zkuste to prosím znovu později.'
        }
      } finally {
        this.isSubmitting = false
      }
    },

    resetForm() {
      this.formData = {
        name: '',
        email: '',
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
  margin: 100px auto 80px auto; /* 200px from top, 80px bottom, centered */
  text-align: center;
  font-size: 42px;
}
.faq-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.faq-header {
  text-align: center;
  margin-bottom: 40px;
}

.faq-header h1 {
  color: #333;
  font-size: 32px;
}

.faq-list {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 60px;
}

.faq-item {
  border-bottom: 1px solid #eee;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-question-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.faq-question-row:hover {
  background-color: #f9f9f9;
}

.faq-question {
  font-weight: 500;
  font-size: 18px;
  color: #333;
}

.faq-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #333;
  font-size: 20px;
  font-weight: bold;
}

.faq-answer {
  padding: 0 20px 20px;
  color: #666;
  line-height: 1.6;
  font-size: 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Contact Form Styles */
.contact-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 40px;
  margin-top: 60px;
  margin-bottom: 40px;
}

.contact-section h2 {
  text-align: center;
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
}

.contact-intro {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 18px;
  line-height: 1.5;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.contact-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
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
  min-height: 120px;
}

.checkbox-group {
  margin-top: 10px;
  margin-bottom: 25px;
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

.form-actions {
  text-align: center;
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
  min-width: 200px;
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
  text-align: center;
  padding: 30px;
  background-color: #f0f8e5;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 600px;
}

.success-message h3 {
  color: #4caf50;
  font-size: 24px;
  margin-bottom: 15px;
}

.success-message p {
  margin-bottom: 25px;
  line-height: 1.6;
  font-size: 16px;
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

/* Responsive Design */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  h1 {
    font-size: 32px;
    margin: 60px auto 40px auto;
  }

  .HeadingStrip {
    height: 120px;
  }

  .contact-section {
    padding: 25px 20px;
  }
}

@media (max-width: 576px) {
  .faq-question {
    font-size: 16px;
  }

  .faq-question-row {
    padding: 15px;
  }

  .contact-section h2 {
    font-size: 24px;
  }

  .contact-intro {
    font-size: 16px;
  }
}
</style>
