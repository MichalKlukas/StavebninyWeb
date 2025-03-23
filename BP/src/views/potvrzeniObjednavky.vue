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
      </div>

      <div class="order-details">
        <h2>Dokončení objednávky</h2>

        <div class="info-message">
          <div class="icon-info">ℹ️</div>
          <p>
            Objednávky se na webové aplikaci neplatí a neodesílají, slouží pouze k vytvoření
            objednávek.
          </p>
        </div>

        <div class="form-section">
          <h3>Kontaktní údaje</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="name">Jméno a příjmení *</label>
              <input type="text" id="name" v-model="formData.name" required />
            </div>
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" v-model="formData.email" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="phone">Telefon *</label>
              <input type="tel" id="phone" v-model="formData.phone" required />
            </div>
            <div class="form-group">
              <label for="company">Název firmy</label>
              <input type="text" id="company" v-model="formData.company" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="ico">IČO</label>
              <input type="text" id="ico" v-model="formData.ico" />
            </div>
            <div class="form-group">
              <label for="dic">DIČ</label>
              <input type="text" id="dic" v-model="formData.dic" />
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

        <!-- Delivery address section - shown only when delivery is selected -->
        <div class="form-section" v-if="formData.shippingMethod === 'delivery'">
          <h3>Adresa doručení</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="street">Ulice a číslo *</label>
              <input type="text" id="street" v-model="formData.address.street" required />
            </div>
            <div class="form-group">
              <label for="city">Město *</label>
              <input type="text" id="city" v-model="formData.address.city" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="zip">PSČ *</label>
              <input type="text" id="zip" v-model="formData.address.zip" required />
            </div>
            <div class="form-group">
              <button
                @click="calculateShippingCost"
                class="calculate-btn"
                :disabled="!canCalculateDeliveryCost"
              >
                Vypočítat cenu dopravy
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
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'OrderConfirmation',
  setup() {
    const cart = useCart()
    const router = useRouter()

    const cartItems = computed(() => cart.items)
    const cartTotal = computed(() => cart.cartTotal)

    const deliveryCost = ref(0)
    const deliveryDistance = ref(0)

    // Get tomorrow as minimum date for pickup
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    const formData = reactive({
      name: '',
      email: '',
      phone: '',
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

    const canCalculateDeliveryCost = computed(() => {
      return (
        formData.shippingMethod === 'delivery' &&
        formData.address.street &&
        formData.address.city &&
        formData.address.zip
      )
    })

    const isFormValid = computed(() => {
      return (
        formData.name &&
        formData.email &&
        formData.phone &&
        formData.pickupDate &&
        (formData.shippingMethod !== 'delivery' ||
          (formData.address.street && formData.address.city && formData.address.zip))
      )
    })

    const setShippingMethod = (method) => {
      formData.shippingMethod = method
      if (method === 'pickup') {
        deliveryCost.value = 0
        deliveryDistance.value = 0
      }
    }

    const calculateShippingCost = async () => {
      try {
        // Zde by normálně byl kód pro volání Google Maps API pro výpočet vzdálenosti
        // V tomto příkladu použijeme náhodnou vzdálenost pro demonstraci
        const distance = Math.random() * 30 + 5 // Náhodná vzdálenost 5-35 km
        deliveryDistance.value = Math.round(distance * 10) / 10

        // Výpočet ceny dopravy: 500 Kč základ + 30 Kč za km
        const baseCost = 500
        const costPerKm = 30
        deliveryCost.value = baseCost + costPerKm * deliveryDistance.value
      } catch (error) {
        console.error('Chyba při výpočtu ceny dopravy:', error)
        alert('Nepodařilo se vypočítat cenu dopravy. Zkuste to prosím znovu.')
      }
    }

    const goBack = () => {
      router.push('/kosik')
    }

    const submitOrder = async () => {
      try {
        // Zde by byl kód pro odeslání objednávky na server
        // Pro demonstraci pouze zobrazíme hlášku a pak přesměrujeme na homepage

        alert('Vaše objednávka byla úspěšně vytvořena!')
        // Vyčistit košík
        cart.clearCart()
        // Přesměrovat na domovskou stránku
        router.push('/')
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
      // Pokud je košík prázdný, přesměrovat zpět na košík
      if (cartItems.value.length === 0) {
        router.push('/kosik')
      }
    })

    return {
      cartItems,
      cartTotal,
      formData,
      minDate,
      deliveryCost,
      deliveryDistance,
      canCalculateDeliveryCost,
      isFormValid,
      setShippingMethod,
      calculateShippingCost,
      goBack,
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
}

@media (max-width: 576px) {
  .confirmation-container {
    padding: 10px;
  }
}
</style>
