<template>
  <div class="brand-filter">
    <ul class="brand-list">
      <li v-for="brand in brands" :key="brand.id" class="brand-item">
        <label class="checkbox-container">
          <input
            type="checkbox"
            :value="brand.name"
            :checked="selectedBrands.includes(brand.name)"
            @change="toggleBrand(brand.name)"
          />
          <span class="brand-name">{{ brand.name }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'BrandFilter',
  props: {
    brands: {
      type: Array,
      default: () => []
    },
    selectedBrands: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    toggleBrand(brandName) {
      const selected = [...this.selectedBrands]

      if (selected.includes(brandName)) {
        const index = selected.indexOf(brandName)
        selected.splice(index, 1)
      } else {
        selected.push(brandName)
      }

      this.$emit('update:brands', selected)
    }
  }
}
</script>

<style scoped>
.brand-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.brand-item {
  margin-bottom: 8px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-container input {
  margin-right: 8px;
}

.brand-name {
  flex: 1;
}
</style>
