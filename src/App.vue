<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import AppLayout from './components/AppLayout.vue'

const themeOverrides = {
  common: {
    primaryColor: '#22c55e',
    primaryColorHover: '#16a34a',
    primaryColorPressed: '#15803d',
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
