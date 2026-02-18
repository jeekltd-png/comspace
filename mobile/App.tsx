import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import Constants from 'expo-constants';
import './src/i18n'; // Initialize i18n

// SECURITY: Never hardcode API keys. Use environment variables via app.json extra field.
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || '';

export default function App() {
  return (
    <Provider store={store}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </StripeProvider>
    </Provider>
  );
}
