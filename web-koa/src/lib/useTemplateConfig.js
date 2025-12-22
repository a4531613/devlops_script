import { ref } from 'vue'
import { api } from '../api/client'

export function useTemplateConfig(templateIdRef) {
  const loading = ref(false)
  const config = ref(null)

  async function load() {
    if (!templateIdRef.value) {
      config.value = null
      return
    }
    loading.value = true
    try {
      config.value = (await api.get(`/templates/${templateIdRef.value}/config`)).data
    } finally {
      loading.value = false
    }
  }

  async function save(payload) {
    if (!templateIdRef.value) return
    await api.put(`/templates/${templateIdRef.value}/config`, payload)
  }

  return { loading, config, load, save }
}

