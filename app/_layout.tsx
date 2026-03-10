import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RubberProvider } from '../context/RubberContext';

export default function RootLayout() {
  return (
    <RubberProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f1117' },
        }}
      />
    </RubberProvider>
  );
}
