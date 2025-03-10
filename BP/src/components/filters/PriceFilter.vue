<template>
  <div class="price-filter">
    <input
      type="range"
      class="price-slider"
      :min="minPrice"
      :max="maxPrice"
      :value="currentRange[1]"
      @input="updateMaxPrice"
    />
    <div class="price-inputs">
      <div>
        <input
          type="number"
          class="price-input"
          :min="minPrice"
          :max="currentRange[1]"
          :value="currentRange[0]"
          @input="updateMinPrice"
        />
        <span class="kc-label">Kč</span>
      </div>
      <div>
        <input
          type="number"
          class="price-input"
          :min="currentRange[0]"
          :max="maxPrice"
          :value="currentRange[1]"
          @input="updateMaxPrice"
        />
        <span class="kc-label">Kč</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PriceFilter',
  props: {
    minPrice: {
      type: Number,
      required: true
    },
    maxPrice: {
      type: Number,
      required: true
    },
    modelValue: {
      type: Array,
      default: () => [0, 1000]
    }
  },
  data() {
    return {
      currentRange: [this.minPrice, this.maxPrice]
    }
  },
  watch: {
    minPrice: {
      handler(newVal) {
        this.currentRange = [newVal, Math.max(newVal, this.currentRange[1])]
        this.emitUpdate()
      }
    },
    maxPrice: {
      handler(newVal) {
        this.currentRange = [Math.min(this.currentRange[0], newVal), newVal]
        this.emitUpdate()
      }
    },
    modelValue: {
      handler(newVal) {
        this.currentRange = newVal
      },
      immediate: true
    }
  },
  methods: {
    updateMinPrice(event) {
      const value = parseInt(event.target.value, 10)
      if (!isNaN(value)) {
        this.currentRange = [
          Math.max(this.minPrice, Math.min(value, this.currentRange[1])),
          this.currentRange[1]
        ]
        this.emitUpdate()
      }
    },
    updateMaxPrice(event) {
      const value = parseInt(event.target.value, 10)
      if (!isNaN(value)) {
        this.currentRange = [
          this.currentRange[0],
          Math.min(this.maxPrice, Math.max(value, this.currentRange[0]))
        ]
        this.emitUpdate()
      }
    },
    emitUpdate() {
      this.$emit('update:price-range', this.currentRange)
    }
  }
}
</script>

<style scoped>
.price-filter {
  width: 100%;
}

.price-slider {
  width: 100%;
  margin: 10px 0;
}

.price-inputs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.price-input {
  width: 70px;
  padding: 5px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.kc-label {
  margin-left: 5px;
  color: #666;
}
</style>
