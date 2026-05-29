import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simplesmanutencao.app',
  appName: 'Simples Manutenção',
  webDir: 'dist',
  server: {
    // App carrega o site publicado (atualizações via deploy, sem novo AAB).
    // O service worker (PWA) faz o cache do shell para manter o funcionamento offline.
    url: 'https://simplesmanutencao.com.br',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e40af'
    }
  }
};

export default config;
