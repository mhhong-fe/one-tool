<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import AppLayout from './components/AppLayout.vue'

const themeOverrides = {
  common: {
    primaryColor: '#6366f1',
    primaryColorHover: '#4f46e5',
    primaryColorPressed: '#4338ca',
    borderRadius: '10px',
    borderRadiusSmall: '8px',
  },
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <AppLayout />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
