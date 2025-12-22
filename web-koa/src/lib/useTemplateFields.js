import { ref } from 'vue'
import { api } from '../api/client'

export function useTemplateFields(templateIdRef) {
  const loading = ref(false)
  const fields = ref([])

  async function load() {
    if (!templateIdRef.value) {
      fields.value = []
      return
    }
    loading.value = true
    try {
      fields.value = (await api.get(`/templates/${templateIdRef.value}/fields`)).data
    } finally {
      loading.value = false
    }
  }

  return { loading, fields, load }
}

