import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import './src/i18n'; // Initialize i18n

const STRIPE_PUBLISHABLE_KEY = 'pk_test_your-stripe-publishable-key';

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
