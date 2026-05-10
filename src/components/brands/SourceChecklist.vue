<template>
  <div>
    <div class="checklist-container">
      <!-- Predefined sources -->
      <div
        v-for="source in PREDEFINED_SOURCES"
        :key="source"
        :class="['checklist-row', { 'checklist-row--locked': source === LOCKED_SOURCE }]"
        @click="source !== LOCKED_SOURCE && toggleSource(source)"
      >
        <input
          type="checkbox"
          :checked="isSelected(source)"
          :disabled="source === LOCKED_SOURCE"
          @click.stop="source !== LOCKED_SOURCE && toggleSource(source)"
          class="checklist-checkbox"
        />
        <span class="checklist-label">
          {{ source }}
          <span v-if="source === LOCKED_SOURCE" class="locked-badge">Required</span>
        </span>
      </div>

      <!-- Divider + custom sources -->
      <template v-if="allCustomSources.length > 0">
        <div class="checklist-divider"></div>
        <div
          v-for="source in allCustomSources"
          :key="source"
          class="checklist-row"
          @click="toggleSource(source)"
        >
          <input
            type="checkbox"
            :checked="isSelected(source)"
            @click.stop="toggleSource(source)"
            class="checklist-checkbox"
          />
          <span class="checklist-label">{{ source }}</span>
        </div>
      </template>

      <!-- Add custom source row -->
      <div class="checklist-divider"></div>
      <div class="checklist-add-row">
        <input
          v-model="newSourceInput"
          type="text"
          placeholder="Add custom source..."
          class="checklist-add-input"
          @keydown.enter.prevent="addCustomSource"
        />
        <button type="button" class="checklist-add-btn" @click="addCustomSource">Add</button>
      </div>
      <p v-if="newSourceError" class="add-error">{{ newSourceError }}</p>
    </div>

    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const PREDEFINED_SOURCES = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
const LOCKED_SOURCE      = 'Website';

const props = defineProps({
  modelValue:    { type: Array,  default: () => [] },
  customSources: { type: Array,  default: () => [] },
  error:         { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const localCustomSources = ref([]);
const sessionSources     = ref([]);
const newSourceInput     = ref('');
const newSourceError     = ref('');

const allCustomSources = computed(() => [
  ...localCustomSources.value,
  ...sessionSources.value,
]);

watch(
  () => props.customSources,
  (val) => { localCustomSources.value = val ?? []; },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (val) => {
    if (!val.includes(LOCKED_SOURCE)) {
      emit('update:modelValue', [LOCKED_SOURCE, ...val]);
    }
  },
  { immediate: true }
);

const isSelected = (source) =>
  source === LOCKED_SOURCE ? true : props.modelValue.includes(source);

const toggleSource = (source) => {
  if (source === LOCKED_SOURCE) return;
  const current = [...props.modelValue];
  const idx = current.indexOf(source);
  if (idx === -1) {
    emit('update:modelValue', [...current, source]);
  } else {
    current.splice(idx, 1);
    emit('update:modelValue', current);
  }
};

const addCustomSource = () => {
  const val = newSourceInput.value.trim();
  if (!val) return;

  const all = [
    ...PREDEFINED_SOURCES,
    ...localCustomSources.value,
    ...sessionSources.value,
  ];

  if (all.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
    newSourceError.value = 'Source already exists.';
    return;
  }

  sessionSources.value = [...sessionSources.value, val];
  emit('update:modelValue', [...props.modelValue, val]);
  newSourceInput.value  = '';
  newSourceError.value  = '';
};
</script>

<style scoped>
.checklist-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.checklist-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
  user-select: none;
}

.checklist-row:last-child {
  border-bottom: none;
}

.checklist-row:hover {
  background: #f9fafb;
}

.checklist-row--locked {
  cursor: default;
  background: #f9fafb;
}

.checklist-row--locked:hover {
  background: #f9fafb;
}

.checklist-checkbox {
  width: 15px;
  height: 15px;
  accent-color: #111827;
  cursor: pointer;
  flex-shrink: 0;
}

.checklist-label {
  font-size: 14px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.locked-badge {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  background: #e5e7eb;
  border-radius: 999px;
  padding: 1px 7px;
}

.checklist-divider {
  height: 1px;
  background: #e5e7eb;
}

.checklist-add-row {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  gap: 8px;
}

.checklist-add-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #374151;
  background: transparent;
  font-family: inherit;
}

.checklist-add-input::placeholder {
  color: #9ca3af;
}

.checklist-add-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 4px;
}

.checklist-add-btn:hover {
  text-decoration: underline;
}

.add-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
  padding: 0 2px;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 6px;
}
</style>
