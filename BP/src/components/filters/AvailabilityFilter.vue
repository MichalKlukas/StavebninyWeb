<template>
  <div class="availability-filter">
    <ul class="availability-list">
      <li class="availability-item">
        <label class="checkbox-container">
          <input
            type="checkbox"
            id="inStock"
            :checked="availability.inStock"
            @change="toggleAvailability('inStock')"
          />
          <span>Skladem</span>
        </label>
      </li>
      <li class="availability-item">
        <label class="checkbox-container">
          <input
            type="checkbox"
            id="notInStock"
            :checked="availability.notInStock"
            @change="toggleAvailability('notInStock')"
          />
          <span>Není skladem</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'AvailabilityFilter',
  props: {
    availability: {
      type: Object,
      default: () => ({
        inStock: true,
        notInStock: false
      })
    }
  },
  methods: {
    toggleAvailability(type) {
      const updated = { ...this.availability }
      updated[type] = !updated[type]

      // Ensure at least one option is selected
      if (!updated.inStock && !updated.notInStock) {
        updated[type] = true // Revert change if both would be unchecked
      }

      this.$emit('update:availability', updated)
    }
  }
}
</script>

<style scoped>
.availability-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.availability-item {
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
</style>
