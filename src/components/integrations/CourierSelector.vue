<template>
  <div class="courier-grid">
    <div
      v-for="courier in COURIERS"
      :key="courier.slug"
      :class="cardClasses(courier.slug)"
      @click="selectCourier(courier.slug)"
    >
      <span v-if="modelValue === courier.slug" class="checkmark">✓</span>

      <div class="logo-wrapper">
        <img
          v-if="!imgError[courier.slug]"
          :src="courier.image"
          :alt="courier.name"
          width="48"
          height="48"
          @error="() => onImgError(courier.slug)"
        />
        <div v-else class="logo-fallback">
          <span>{{ courier.name.charAt(0) }}</span>
        </div>
      </div>

      <p class="courier-name">{{ courier.name }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { COURIERS } from '../../constants/couriers';

const props = defineProps({
  modelValue: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  disabledSlug: { type: String, default: null },
});

const emit = defineEmits(['update:modelValue']);
const imgError = reactive({});

const cardClasses = (slug) => {
  const base = 'courier-card';
  const isSelected = props.modelValue === slug;
  const isDisabled = props.disabled && slug !== props.disabledSlug;
  const isLocked = props.disabled && slug === props.disabledSlug;

  if (isLocked) return `${base} selected locked`;
  if (isDisabled) return `${base} disabled`;
  if (isSelected) return `${base} selected`;
  return base;
};

const selectCourier = (slug) => {
  if (props.disabled) return;
  emit('update:modelValue', slug);
};

const onImgError = (slug) => {
  imgError[slug] = true;
};
</script>

<style scoped>
.courier-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.courier-card {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  padding: 20px;
  background: #fff;
  cursor: pointer;
  transition: border 0.2s, background 0.2s, transform 0.2s;
  text-align: center;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.courier-card:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.courier-card.selected {
  border: 2px solid #1e293b;
  background: #f8fafc;
}

.courier-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.courier-card.locked {
  opacity: 1;
  cursor: not-allowed;
}

.checkmark {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #1e293b;
  color: #fff;
  border-radius: 999px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.logo-wrapper {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.logo-wrapper img,
.logo-fallback {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.logo-fallback {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-weight: 600;
}

.courier-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
</style>
