<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">Rychlé odkazy</h3>
          <ul class="footer-links">
            <li><router-link to="/">Domů</router-link></li>
            <li><router-link to="/o-nas">O nás</router-link></li>
            <li><router-link to="/mateDotaz">Máte dotaz</router-link></li>
            <li><router-link to="/poptavka">Poptávka</router-link></li>
          </ul>
        </div>

        <div class="footer-section">
          <h3 class="footer-title">Kontaktní údaje</h3>
          <ul class="contact-info">
            <li class="contact-item">
              <span class="icon">
                <img src="@/assets/ikonkyFooter/poloha.png" alt="Adresa" class="icon-img" />
              </span>
              <span class="contact-text">Lysá nad Labem, Sokolovská 1143</span>
            </li>
            <li class="contact-item">
              <span class="icon">
                <img src="@/assets/ikonkyFooter/telefon.png" alt="Telefon" class="icon-img" />
              </span>
              <span class="contact-text">775 315 349</span>
            </li>
            <li class="contact-item">
              <span class="icon">
                <img src="@/assets/ikonkyFooter/mail.png" alt="Email" class="icon-img" />
              </span>
              <span class="contact-text">stavebninybaroch@seznam.cz</span>
            </li>
            <li class="contact-item">
              <span class="icon">
                <img
                  src="@/assets/ikonkyFooter/oteviraciDoba.png"
                  alt="Otevírací doba"
                  class="icon-img"
                />
              </span>
              <span class="contact-text">po-pá 7:00 - 17:00, so 7:00 - 12:00</span>
            </li>
            <li class="contact-item">
              <span class="icon">
                <span class="text-icon">IČ</span>
              </span>
              <span class="contact-text">IČO: 07638230</span>
            </li>
          </ul>
        </div>

        <div class="footer-section account-section">
          <h3 class="footer-title">Můj účet</h3>
          <ul class="footer-links">
            <li><router-link to="/profil">Můj účet</router-link></li>
            <li><router-link to="/objednavky">Moje objednávky</router-link></li>
          </ul>
        </div>

        <div class="footer-section logo-section">
          <img src="@/assets/logo.png" alt="Stavebniny Lysa logo" class="footer-logo" />
        </div>
      </div>

      <div class="footer-bottom">
        <div class="copyright">© {{ currentYear }} Stavební a obchodní spol. Lysá s.r.o.</div>
        <div class="disclaimer">Ceny a sortiment se mohou změnit bez předchozího upozornění.</div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Footer',
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
})
</script>

<style scoped>
.footer {
  background-color: #f8f8f8;
  padding: 40px 0 20px;
  margin-top: 40px;
  border-top: 1px solid #eee;
  font-family: 'Arial', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 30px;
}

.footer-section {
  width: 23%;
  margin-bottom: 20px;
}

.footer-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
  position: relative;
  padding-bottom: 8px;
}

.footer-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background-color: #f5852a; /* Stavební oranžová */
}

.footer-links,
.contact-info {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li,
.contact-info li {
  margin-bottom: 10px;
}

.footer-links a {
  text-decoration: none;
  color: #555;
  transition:
    color 0.2s,
    transform 0.2s;
  display: inline-block;
  position: relative;
}

.footer-links a:hover {
  color: #f5852a; /* Stavební oranžová */
  transform: translateX(3px);
}

.footer-links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #f5852a;
  transition: width 0.3s;
}

.footer-links a:hover::after {
  width: 100%;
}

.contact-info li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.icon {
  margin-right: 10px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.text-icon {
  font-weight: bold;
  font-size: 16px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.contact-text {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

.footer-logo {
  max-width: 180px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-section {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  font-size: 13px;
  color: #777;
}

/* Responzivní design */
@media (max-width: 992px) {
  .footer-content {
    flex-wrap: wrap;
  }

  .footer-section {
    width: 48%;
  }

  /* First row: Quick links and Contact info */
  .footer-section:nth-child(1),
  .footer-section:nth-child(2) {
    order: 1;
  }

  /* Second row: Account info and Logo */
  .account-section {
    order: 3;
  }

  .logo-section {
    order: 4;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
}

@media (max-width: 576px) {
  .footer-section {
    width: 100%;
    text-align: center;
  }

  /* Logo first, then the rest */
  .logo-section {
    order: 1;
    width: 100%;
    justify-content: center;
    margin-bottom: 30px;
  }

  /* Then other sections */
  .footer-section:not(.logo-section) {
    order: 2;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .footer-title {
    text-align: center;
  }

  .footer-title::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .contact-info {
    display: inline-block;
    text-align: left;
  }
}
</style>
