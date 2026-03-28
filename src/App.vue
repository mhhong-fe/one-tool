<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import AppLayout from './components/AppLayout.vue'

const themeOverrides = {
  common: {
    primaryColor: '#D97757',
    primaryColorHover: '#C4623E',
    primaryColorPressed: '#B55530',
    primaryColorSuppl: '#E8906E',
    borderRadius: '8px',
    borderRadiusSmall: '6px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    bodyColor: '#F5F0E8',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    popoverColor: '#FFFFFF',
    baseColor: '#FFFFFF',
  },
  Button: {
    colorPrimary: '#1A1A1A',
    colorHoverPrimary: '#2D2D2D',
    colorPressedPrimary: '#000000',
    textColorPrimary: '#FFFFFF',
    textColorHoverPrimary: '#FFFFFF',
    textColorPressedPrimary: '#FFFFFF',
    borderPrimary: '1px solid #1A1A1A',
    borderHoverPrimary: '1px solid #1A1A1A',
    borderPressedPrimary: '1px solid #000000',
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
