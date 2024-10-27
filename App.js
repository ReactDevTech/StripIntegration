import {
  confirmPlatformPayPayment,
  PlatformPay,
  PlatformPayButton,
  StripeProvider,
  usePlatformPay
} from '@stripe/stripe-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';

// Main component of the app
const App = () => {
  // Destructure to get method to check platform pay support (Google Pay / Apple Pay)
  const { isPlatformPaySupported } = usePlatformPay();
  // State to store if Apple Pay is supported
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);

  // useEffect hook to check if the platform supports Google Pay or Apple Pay on app load
  useEffect(() => {
    const checkPlatformPaySupport = async () => {
      // Check Apple Pay support
      const applePaySupported = await isPlatformPaySupported();
      setIsApplePaySupported(applePaySupported);

      // Check Google Pay support
      const googlePaySupported = await isPlatformPaySupported({
        googlePay: { testEnv: true },
      });
      if (!googlePaySupported) {
        Alert.alert('Google Pay is not supported.');
      }
    };

    checkPlatformPaySupport();
  }, [isPlatformPaySupported]);

  // Function to create a payment intent with Stripe server
  const createPaymentIntent = async () => {
    try {
      // Send POST request to Stripe API to create a new payment intent
      const response = await fetch(
        'https://api.stripe.com/v1/payment_intents',
        {
          method: 'POST',
          headers: {
            Authorization:
              'Bearer key', // Your Stripe secret key here
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: 1500, // Amount in cents (e.g., €15.00)
            currency: 'eur', // Currency set to euros
            'automatic_payment_methods[enabled]': true, // Enable automatic payment methods
          }).toString(),
        },
      );

      // Check if request was unsuccessful
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(
          `Failed to create payment intent: ${errorResponse.error.message}`,
        );
      }

      // Extract client secret needed for payment
      const { client_secret } = await response.json();
      return client_secret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', error.message);
      throw error; // Re-throw to handle in payment function
    }
  };

  // Function to create payment method and confirm payment through Apple Pay / Google Pay
  const createPaymentMethod = async () => {
    try {
      // Obtain client secret from the created payment intent
      const clientSecret = await createPaymentIntent();

      // Call Stripe's confirmPlatformPayPayment method for Apple Pay / Google Pay
      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: 'Total', // Displayed on Apple Pay dialog
              amount: '15', // Total amount in dollars
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: 'US', // Required country code for merchant
          currencyCode: 'USD', // Required currency code for transaction
          requiredBillingContactFields: [PlatformPay.ContactField.PhoneNumber], // Billing info required
        },
        googlePay: {
          testEnv: true, // Set test environment for Google Pay
          merchantName: 'My merchant name',
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          billingAddressConfig: {
            format: PlatformPay.BillingAddressFormat.Full,
            isRequired: true,
          },
        },
      });

      // Check for any errors in the payment process
      if (error) {
        console.error('Payment error:', error);
        Alert.alert('Payment Error', error.message);
      } else {
        Alert.alert('Success', 'Check the logs for payment intent details.');
        console.log('Payment Intent:', { clientSecret });
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      Alert.alert('Error', error.message);
    }
  };

  // JSX structure of the component
  return (
    <SafeAreaView style={styles.container}>
      <StripeProvider
        publishableKey="" // Your Stripe publishable key here
        merchantIdentifier="Your merchant bundle id" // Required for Apple Pay
        urlScheme="your-url-scheme" // Required for 3D Secure and bank redirects
      >
        {/* Show Apple Pay button if Apple Pay is supported */}
        {isApplePaySupported && (
          <PlatformPayButton
            onPress={createPaymentMethod} // Call function to handle payment on button press
            type={PlatformPay.ButtonType.Pay}
            appearance={PlatformPay.ButtonStyle.WhiteOutline}
            style={styles.payButton}
          />
        )}
      </StripeProvider>
    </SafeAreaView>
  );
};

// Styling for the container and pay button
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButton: {
    width: '65%',
    height: 50,
  },
});

export default App;
