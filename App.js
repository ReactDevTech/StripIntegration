import {
  confirmPlatformPayPayment,
  PlatformPay,
  PlatformPayButton,
  StripeProvider,
  usePlatformPay
} from '@stripe/stripe-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';

const App = () => {
  const {isPlatformPaySupported} = usePlatformPay();
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);

  useEffect(() => {
    const checkPlatformPaySupport = async () => {
      const applePaySupported = await isPlatformPaySupported();
      setIsApplePaySupported(applePaySupported);

      const googlePaySupported = await isPlatformPaySupported({
        googlePay: {testEnv: true},
      });
      if (!googlePaySupported) {
        Alert.alert('Google Pay is not supported.');
      }
    };

    checkPlatformPaySupport();
  }, [isPlatformPaySupported]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch(
        'https://api.stripe.com/v1/payment_intents',
        {
          method: 'POST',
          headers: {
            Authorization:
              'Bearer key',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: 1500, // Amount in cents
            currency: 'eur',
            'automatic_payment_methods[enabled]': true,
          }).toString(),
        },
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(
          `Failed to create payment intent: ${errorResponse.error.message}`,
        );
      }

      const {client_secret} = await response.json();
      return client_secret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', error.message);
      throw error; // Re-throw for handling in the pay function
    }
  };

  const createPaymentMethod = async () => {
    try {
      const clientSecret = await createPaymentIntent();
      const {error} = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: 'Total',
              amount: '15',
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          requiredBillingContactFields: [PlatformPay.ContactField.PhoneNumber],
        },
        googlePay: {
          testEnv: true,
          merchantName: 'My merchant name',
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          billingAddressConfig: {
            format: PlatformPay.BillingAddressFormat.Full,
            isRequired: true,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        Alert.alert('Payment Error', error.message);
      } else {
        Alert.alert('Success', 'Check the logs for payment intent details.');
        console.log('Payment Intent:', {clientSecret});
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StripeProvider
        publishableKey=""
        merchantIdentifier="Your  merchant bundel id" // Required for Apple Pay
        urlScheme="your-url-scheme" // Required for 3D Secure and bank redirects
      >
        {isApplePaySupported && (
          <PlatformPayButton
            onPress={createPaymentMethod}
            type={PlatformPay.ButtonType.Pay}
            appearance={PlatformPay.ButtonStyle.WhiteOutline}
            style={styles.payButton}
          />
        )}
      </StripeProvider>
    </SafeAreaView>
  );
};

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
