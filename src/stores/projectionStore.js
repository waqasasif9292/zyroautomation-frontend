import { defineStore } from 'pinia';
import { ref } from 'vue';
import ProjectionService from '../services/ProjectionService';

export const useProjectionStore = defineStore('projection', () => {
  const projections = ref([]);
  const loading = ref(false);
  const formLoading = ref(false);

  const fetchProjections = async () => {
    loading.value = true;
    try {
      const res = await ProjectionService.getProjections();
      projections.value = res.data.data.projections;
    } finally {
      loading.value = false;
    }
  };

  const fetchProjection = async (id) => {
    const res = await ProjectionService.getProjection(id);
    return res.data.data.projection;
  };

  const createProjection = async (payload) => {
    formLoading.value = true;
    try {
      const res = await ProjectionService.createProjection(payload);
      projections.value.unshift(res.data.data.projection);
      return res.data.data.projection;
    } finally {
      formLoading.value = false;
    }
  };

  const updateProjection = async (id, payload) => {
    formLoading.value = true;
    try {
      const res = await ProjectionService.updateProjection(id, payload);
      const updated = res.data.data.projection;
      const idx = projections.value.findIndex(projection => projection.id === id);
      if (idx !== -1) projections.value[idx] = updated;
      return updated;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteProjection = async (id) => {
    await ProjectionService.deleteProjection(id);
    projections.value = projections.value.filter(projection => projection.id !== id);
  };

  const fetchAiSuggestions = async (id) => {
    const res = await ProjectionService.getAiSuggestions(id);
    return res.data.data.insights;
  };

  return {
    projections,
    loading,
    formLoading,
    fetchProjections,
    fetchProjection,
    createProjection,
    updateProjection,
    deleteProjection,
    fetchAiSuggestions,
  };
});
