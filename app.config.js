const pkg = require('./package.json');

module.exports = () => ({
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'Rubber Bridge',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'rubber-bridge',
    version: pkg.version,
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'rubber-bridge',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    platforms: ['ios', 'android', 'web'],
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
    },
    android: {
      package: 'com.newduke.rubberbridge',
      adaptiveIcon: {
        backgroundColor: process.env.EXPO_PUBLIC_ANDROID_ADAPTIVE_ICON_BG || '#1b5e20',
      },
    },
    plugins: ['expo-asset', 'expo-router'],
    extra: {
      appEnv: process.env.APP_ENV || 'development',
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
      eas: {
        projectId: '3a1b18e6-98e9-42e3-8fe5-14f60191f3fb',
      },
    },
  },
});
