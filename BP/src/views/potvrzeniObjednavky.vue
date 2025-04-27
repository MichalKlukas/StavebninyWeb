<template>
  <div class="HeadingStrip">
    <h1>Potvrzení objednávky</h1>
  </div>
  <div class="confirmation-container">
    <div class="confirmation-content">
      <div class="order-summary">
        <h2>Souhrn objednávky</h2>

        <div v-if="cartItems.length > 0" class="order-items">
          <div class="order-item" v-for="(item, index) in cartItems" :key="index">
            <div class="item-details">
              <img :src="item.image" :alt="item.name" class="item-image" />
              <div>
                <h3 class="item-name">{{ item.name }}</h3>
                <p class="item-quantity">{{ item.quantity }} {{ item.priceUnit || 'ks' }}</p>
              </div>
            </div>
            <div class="item-price">{{ formatPrice(parseFloat(item.price) * item.quantity) }}</div>
          </div>

          <div class="order-total">
            <div class="total-row">
              <span>Mezisoučet:</span>
              <span>{{ formatPrice(cartTotal) }}</span>
            </div>
            <div class="total-row">
              <span>DPH (21%):</span>
              <span>{{ formatPrice(cartTotal * 0.21) }}</span>
            </div>
            <div class="total-row" v-if="deliveryCost > 0">
              <span>Doprava:</span>
              <span>{{ formatPrice(deliveryCost) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Celkem k úhradě:</span>
              <span>{{ formatPrice(cartTotal + deliveryCost) }}</span>
            </div>
          </div>
        </div>

        <!-- Přehled kontaktních údajů z profilu -->
        <div class="user-details">
          <h3>Vaše kontaktní údaje</h3>
          <div class="contact-info">
            <div class="info-row">
              <span class="info-label">Jméno:</span>
              <span class="info-value">{{ userInfo.firstName }} {{ userInfo.lastName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">{{ userInfo.email }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Telefon:</span>
              <span class="info-value">{{ userInfo.phone || 'Nevyplněno' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="order-details">
        <h2>Dokončení objednávky</h2>

        <div class="info-message">
          <div class="icon-info">ℹ️</div>
          <p>
            Objednávky se na webu neplatí a neodesílají, slouží pouze k vytvoření objednávek, které
            je potřeba zaplatit na prodejně. Ceny jsou pouze základní, takže nemusí odpovídat
            finální částce.
          </p>
        </div>

        <!-- Toggle pro nákup na firmu -->
        <div class="form-section">
          <div class="company-toggle">
            <label class="toggle-label">
              <input type="checkbox" v-model="formData.isCompanyPurchase" />
              <span class="toggle-text">Nákup na firmu</span>
            </label>
          </div>

          <!-- Firemní údaje - zobrazí se pouze pokud je zaškrtnuto "Nákup na firmu" -->
          <div v-if="formData.isCompanyPurchase" class="company-details">
            <div class="form-row">
              <div class="form-group">
                <label for="company">Název firmy *</label>
                <input type="text" id="company" v-model="formData.company" required />
              </div>
              <div class="form-group">
                <label for="ico">IČO *</label>
                <input type="text" id="ico" v-model="formData.ico" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="dic">DIČ</label>
                <input type="text" id="dic" v-model="formData.dic" />
              </div>
              <div class="form-group"></div>
              <!-- Prázdný div pro zachování layoutu -->
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Datum vyzvednutí / doručení</h3>
          <div class="form-group">
            <label for="pickup-date">Datum *</label>
            <input
              type="date"
              id="pickup-date"
              v-model="formData.pickupDate"
              required
              :min="minDate"
            />
          </div>
          <p class="note">
            Vyberte datum, kdy si přejete objednávku vyzvednout nebo nechat doručit.
          </p>
        </div>

        <div class="form-section">
          <h3>Způsob dopravy</h3>
          <div class="shipping-toggle">
            <div
              class="shipping-option"
              :class="{ active: formData.shippingMethod === 'pickup' }"
              @click="setShippingMethod('pickup')"
            >
              <div class="option-icon">🏢</div>
              <div class="option-details">
                <h4>Osobní odběr</h4>
                <p>Zdarma</p>
              </div>
            </div>
            <div
              class="shipping-option"
              :class="{ active: formData.shippingMethod === 'delivery' }"
              @click="setShippingMethod('delivery')"
            >
              <div class="option-icon">🚚</div>
              <div class="option-details">
                <h4>Doručení na adresu</h4>
                <p>Cena bude vypočítána na základě vzdálenosti</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Replace the current delivery address section with this -->
        <div class="form-section" v-if="formData.shippingMethod === 'delivery'">
          <h3>Adresa doručení</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="delivery-street">Ulice a č.p. *</label>
              <input
                type="text"
                id="delivery-street"
                v-model="formData.address.street"
                required
                placeholder="Například: Sokolovská 123/5"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="delivery-city">Město *</label>
              <input
                type="text"
                id="delivery-city"
                v-model="formData.address.city"
                required
                placeholder="Například: Praha"
              />
            </div>
            <div class="form-group">
              <label for="delivery-zip">PSČ *</label>
              <input
                type="text"
                id="delivery-zip"
                v-model="formData.address.zip"
                required
                placeholder="Například: 12000"
                maxlength="5"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <button
                @click="calculateShippingCost"
                class="calculate-btn"
                :disabled="!canCalculateDeliveryCost || isCalculating"
              >
                {{ isCalculating ? 'Výpočet...' : 'Vypočítat cenu dopravy' }}
              </button>
            </div>
          </div>

          <div v-if="deliveryCost > 0" class="delivery-info">
            <h4>Cena dopravy: {{ formatPrice(deliveryCost) }}</h4>
            <p>Základní cena dopravy: 500 Kč + 30 Kč za kilometr</p>
            <p class="warning-text">Za využití hydraulické ruky se účtuje 100 Kč za paletu.</p>
          </div>

          <div v-if="deliveryDistance > 0" class="delivery-distance">
            <p>Vzdálenost: {{ deliveryDistance.toFixed(1) }} km</p>
          </div>
        </div>

        <div class="form-section">
          <h3>Poznámka k objednávce</h3>
          <div class="form-group">
            <textarea
              id="note"
              v-model="formData.note"
              rows="4"
              placeholder="Máte nějaké speciální požadavky? Napište nám je zde."
            ></textarea>
          </div>
        </div>

        <div class="buttons-container">
          <button class="back-btn" @click="goBack">Zpět do košíku</button>
          <button class="confirm-btn" @click="submitOrder" :disabled="!isFormValid">
            Dokončit objednávku
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCart } from '@/stores/stavKosiku'
import { useUserStore } from '@/stores'
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const isCalculating = ref(false)

export default {
  name: 'OrderConfirmation',
  setup() {
    const cart = useCart()
    const userStore = useUserStore()
    const router = useRouter()

    const cartItems = computed(() => cart.items)
    const cartTotal = computed(() => cart.cartTotal)

    const deliveryCost = ref(0)
    const deliveryDistance = ref(0)
    const userInfo = ref({})

    // Get tomorrow as minimum date for pickup
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    const formData = reactive({
      isCompanyPurchase: false,
      company: '',
      ico: '',
      dic: '',
      pickupDate: minDate,
      shippingMethod: cart.shippingMethod || 'pickup',
      address: {
        street: '',
        city: '',
        zip: ''
      },
      note: ''
    })

    // Kontrola, zda má uživatel vyplněnou adresu
    const hasValidAddress = computed(() => {
      if (formData.shippingMethod !== 'delivery') return true
      return !!(formData.address.street && formData.address.city && formData.address.zip)
    })

    const canCalculateDeliveryCost = computed(() => {
      return formData.shippingMethod === 'delivery' && hasValidAddress.value
    })

    const isFormValid = computed(() => {
      // Základní validace
      const baseValid = formData.pickupDate && hasValidAddress.value

      // Pokud je zaškrtnuto "Nákup na firmu", zkontrolujeme povinné firemní údaje
      if (formData.isCompanyPurchase) {
        return baseValid && formData.company && formData.ico
      }

      return baseValid
    })

    const setShippingMethod = (method) => {
      formData.shippingMethod = method
      if (method === 'pickup') {
        deliveryCost.value = 0
        deliveryDistance.value = 0
      }
    }

    // Update the calculateShippingCost function:
    const calculateShippingCost = async () => {
      try {
        // Kontrola, zda má uživatel vyplněnou adresu
        if (!hasValidAddress.value) {
          alert('Pro výpočet ceny dopravy je potřeba vyplnit všechny údaje adresy.')
          return
        }

        // Stav načítání
        isCalculating.value = true

        try {
          console.log('Calling calculate-shipping API with address:', formData.address)

          // Voláme backend endpoint, který nám spočítá vzdálenost
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'https://46.28.108.195.nip.io'}/api/calculate-shipping`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userStore.token}`
              },
              body: JSON.stringify({
                address: formData.address
              })
            }
          )

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`API error (${response.status}):`, errorText)
            throw new Error(`Chyba při výpočtu vzdálenosti: ${response.status}`)
          }

          const result = await response.json()
          console.log('API response:', result)

          if (result.success) {
            deliveryDistance.value = result.distance.value
            deliveryCost.value = result.cost

            // Pokud je označeno jako odhad, zobrazíme upozornění
            if (result.details && result.details.isEstimate) {
              alert(
                'Nepodařilo se přesně určit vzdálenost. Zobrazovaná cena dopravy je orientační.'
              )
            }
          } else {
            throw new Error(result.message || 'Nepodařilo se vypočítat vzdálenost')
          }
        } catch (error) {
          console.error('Chyba při volání API pro výpočet vzdálenosti:', error)
          alert('Nepodařilo se vypočítat vzdálenost. Použijeme odhad.')

          // Záložní výpočet, pokud API selže
          const distance = Math.random() * 30 + 5
          deliveryDistance.value = Math.round(distance * 10) / 10
          const baseCost = 500
          const costPerKm = 30
          deliveryCost.value = Math.round(baseCost + costPerKm * deliveryDistance.value)
        } finally {
          isCalculating.value = false
        }
      } catch (error) {
        console.error('Chyba při výpočtu ceny dopravy:', error)
        alert('Nepodařilo se vypočítat cenu dopravy. Zkuste to prosím znovu.')
        isCalculating.value = false
      }
    }

    const goBack = () => {
      router.push('/kosik')
    }

    const goToProfile = () => {
      router.push('/upravit-profil')
    }

    const submitOrder = async () => {
      try {
        // Kontrola, zda je formulář validní
        if (!isFormValid.value) {
          if (formData.shippingMethod === 'delivery' && !hasValidAddress.value) {
            alert('Pro doručení na adresu je potřeba mít vyplněnou adresu ve vašem profilu.')
            return
          }

          if (formData.isCompanyPurchase && (!formData.company || !formData.ico)) {
            alert('Pro nákup na firmu je potřeba vyplnit název firmy a IČO.')
            return
          }

          return
        }

        // Show immediate processing message
        alert('Zpracováváme vaši objednávku...')

        // Empty the cart in UI immediately for better UX
        // We keep a copy for the order creation
        const cartItemsCopy = [...cartItems.value]
        cart.items.value = []

        const orderDetails = {
          name: `${userInfo.value.firstName} ${userInfo.value.lastName}`,
          email: userInfo.value.email,
          phone: userInfo.value.phone,
          company: formData.isCompanyPurchase ? formData.company : null,
          ico: formData.isCompanyPurchase ? formData.ico : null,
          dic: formData.isCompanyPurchase ? formData.dic : null,
          pickupDate: formData.pickupDate,
          shippingMethod: formData.shippingMethod,
          deliveryAddress: formData.shippingMethod === 'delivery' ? formData.address : null,
          deliveryCost: deliveryCost.value,
          note: formData.note
        }

        // Use the cart store's createOrder method with the original items
        const result = await cart.createOrder(orderDetails)

        if (result.success) {
          alert('Vaše objednávka byla úspěšně vytvořena!')
          router.push('/')
        } else {
          // If failed, restore cart items
          cart.items.value = cartItemsCopy
          throw new Error(result.message || 'Nepodařilo se vytvořit objednávku')
        }
      } catch (error) {
        console.error('Chyba při vytváření objednávky:', error)
        alert('Nepodařilo se vytvořit objednávku. Zkuste to prosím znovu.')
      }
    }

    const formatPrice = (price) => {
      if (typeof price === 'string') {
        price = parseFloat(price.replace(',', '.'))
      }

      return (
        price.toLocaleString('cs-CZ', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' Kč'
      )
    }

    onMounted(() => {
      // Načtení informací o uživateli
      if (userStore.isAuthenticated) {
        userInfo.value = { ...userStore.user }

        // Předvyplnění firemních údajů, pokud jsou v profilu
        if (userInfo.value.companyName) {
          formData.company = userInfo.value.companyName
        }

        if (userInfo.value.ico) {
          formData.ico = userInfo.value.ico
        }

        if (userInfo.value.dic) {
          formData.dic = userInfo.value.dic
        }

        console.log('Načtené údaje uživatele:', userInfo.value)
      } else {
        // Pokud uživatel není přihlášen, přesměrujeme ho na přihlášení
        router.push('/prihlaseni')
      }

      // Pokud je košík prázdný, přesměrovat zpět na košík
      if (cartItems.value.length === 0) {
        router.push('/kosik')
      }
    })

    return {
      cartItems,
      cartTotal,
      userInfo,
      formData,
      minDate,
      deliveryCost,
      deliveryDistance,
      hasValidAddress,
      canCalculateDeliveryCost,
      isFormValid,
      setShippingMethod,
      calculateShippingCost,
      goBack,
      isCalculating,
      goToProfile,
      submitOrder,
      formatPrice
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

.confirmation-container {
  max-width: 1200px;
  margin: 0 auto 50px auto;
  padding: 0 20px;
  font-family: Arial, sans-serif;
}

.confirmation-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.order-summary {
  flex: 1 1 35%;
  min-width: 300px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  align-self: flex-start;
}

.order-details {
  flex: 1 1 60%;
  min-width: 300px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

h3 {
  font-size: 18px;
  margin: 0 0 15px 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 15px;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.item-name {
  font-size: 16px;
  margin: 0;
}

.item-quantity {
  font-size: 14px;
  color: #666;
  margin: 5px 0 0 0;
}

.item-price {
  font-weight: 600;
}

.order-total {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.grand-total {
  font-size: 18px;
  font-weight: 700;
  color: #f5852a;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.info-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.icon-info {
  font-size: 24px;
}

.form-section {
  margin-bottom: 30px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 5px;
  font-size: 14px;
  color: #333;
}

input,
textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

textarea {
  resize: vertical;
}

/* Styly pro kontaktní informace */
.user-details {
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.contact-info,
.address-info {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-label {
  flex: 0 0 100px;
  font-weight: 500;
  color: #555;
}

.info-value {
  flex: 1;
}

/* Stylování tlačítka pro přepnutí "Nákup na firmu" */
.company-toggle {
  margin-bottom: 20px;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.toggle-label input {
  margin-right: 10px;
  width: 20px;
  height: 20px;
}

.toggle-text {
  font-weight: 500;
  font-size: 16px;
}

.company-details {
  margin-top: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

/* Varování o chybějící adrese */
.address-warning {
  margin-top: 10px;
  padding: 12px;
  background-color: #fff8e1;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.edit-profile-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #f5852a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.edit-profile-btn:hover {
  background-color: #e67722;
}

.shipping-toggle {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.shipping-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.shipping-option.active {
  border-color: #f5852a;
  background-color: #fff8f0;
}

.option-icon {
  font-size: 28px;
}

.option-details h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.option-details p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.note {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.calculate-btn {
  padding: 10px 15px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  height: 40px;
  margin-top: 24px;
}

.calculate-btn:hover {
  background-color: #e6e6e6;
}

.calculate-btn:disabled {
  background-color: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.delivery-info {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.delivery-info h4 {
  margin: 0 0 10px 0;
  color: #f5852a;
}

.delivery-info p {
  margin: 5px 0;
  font-size: 14px;
}

.warning-text {
  color: #e63946;
  font-weight: 500;
}

.delivery-distance {
  margin-top: 10px;
  font-size: 14px;
}

.buttons-container {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.back-btn,
.confirm-btn {
  padding: 15px 25px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-btn {
  background: none;
  border: 1px solid #ddd;
  color: #333;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.confirm-btn {
  background-color: #f5852a;
  border: none;
  color: white;
  flex: 1;
}

.confirm-btn:hover {
  background-color: #e67722;
}

.confirm-btn:disabled {
  background-color: #f8ad70;
  cursor: not-allowed;
}

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
    gap: 15px;
  }

  .shipping-toggle {
    flex-direction: column;
  }

  .info-row {
    flex-direction: column;
  }

  .info-label {
    margin-bottom: 3px;
  }
}

@media (max-width: 576px) {
  .confirmation-container {
    padding: 10px;
  }
}
</style>
