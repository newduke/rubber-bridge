import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RubberProvider } from '../context/RubberContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RubberProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f1117' },
          }}
        />
      </RubberProvider>
    </SafeAreaProvider>
  );
}
