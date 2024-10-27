import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {
  confirmPaymentSheetPayment,
  initPaymentSheet,
  presentPaymentSheet,
  StripeProvider,
  useStripe,
} from '@stripe/stripe-react-native'; // Ensure you have this import

const App = () => {
  const [loading, setLoading] = useState(false);
  const [iamgeUrl, setTimageUrl] = useState('');
  const {handleURLCallback} = useStripe();
  const handleDeepLink = useCallback(
    async url => {
      if (url) {
        const stripeHandled = await handleURLCallback(url);
        console.log(stripeHandled, 'stripeHandledstripeHandledstripeHandled');

        if (stripeHandled) {
          // This was a Stripe URL - you can return or add extra handling here as you see fit
        } else {
          // This was NOT a Stripe URL – handle as you normally would
        }
      }
    },
    [handleURLCallback],
  );
  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const deepLinkListener = Linking.addEventListener('url', event => {
      handleDeepLink(event.url);
    });

    return () => deepLinkListener.remove();
  }, [handleDeepLink]);

  const createCustomer = async () => {
    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization:
          'Bearer sk_test_51PstVHP2uB1Z8SFX2vlytvTDEwZqADJYZ7y9dFYmTvLG2aQ8BM4Dsxfkr1sznVZdV4N7WGpMOTKGUbYHUyQgZ0qO00vBt5XETe',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to create customer');
    }
    const customerData = await response.json();
    return customerData.id;
  };

  const createEphemeralKey = async customerId => {
    const response = await fetch('https://api.stripe.com/v1/ephemeral_keys', {
      method: 'POST',
      headers: {
        Authorization:
          'Bearer sk_test_51PstVHP2uB1Z8SFX2vlytvTDEwZqADJYZ7y9dFYmTvLG2aQ8BM4Dsxfkr1sznVZdV4N7WGpMOTKGUbYHUyQgZ0qO00vBt5XETe',
        'Stripe-Version': '2024-09-30.acacia',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({customer: customerId}).toString(),
    });
    if (!response.ok) {
      throw new Error('Failed to create ephemeral key');
    }
    const keyData = await response.json();
    return keyData.secret; // Return the ephemeral key secret
  };

  const createPaymentIntent = async customerId => {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization:
          'Bearer sk_test_51PstVHP2uB1Z8SFX2vlytvTDEwZqADJYZ7y9dFYmTvLG2aQ8BM4Dsxfkr1sznVZdV4N7WGpMOTKGUbYHUyQgZ0qO00vBt5XETe',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        amount: 1099,
        currency: 'eur',
        'automatic_payment_methods[enabled]': true,
      }).toString(),
    });
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    const paymentIntentData = await response.json();
    return paymentIntentData.client_secret; // Return the payment intent client secret
  };

  const handlePaymentFlow = async () => {
    setLoading(true);
    try {
      const customerId = await createCustomer();
      const ephemeralKey = await createEphemeralKey(customerId);
      const paymentIntent = await createPaymentIntent(customerId);

      const response = await initPaymentSheet({
        googlePay: {
          merchantCountryCode: 'UK',
          testEnv: true, // use test environment
        },
        merchantDisplayName: 'GogoFarma',
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        returnURL: 'deepLinkUrl://stripe-redirect',
        allowsDelayedPaymentMethods: true,
        customFlow: true,
        defaultBillingDetails: {
          name: 'Jane Doe',
        },
      });
      console.log(response, 'errorerrorerrorerror');
      const responseTwo = await presentPaymentSheet({});
      const confirmResponse = await confirmPaymentSheetPayment();

      setTimageUrl(responseTwo?.paymentOption?.image);
      console.log(confirmResponse, 'Payment successful');
    } catch (error) {
      console.error('Error during payment flow:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StripeProvider publishableKey="pk_test_51PstVHP2uB1Z8SFXOdccOQXyEhPxRZfHJDaZA9i62UaZn6o4bJd6lzUZe7lDAR63tjTLaU7y5Vx0ftZgUtfKIHaC003MxMB1Dd">
      <SafeAreaView style={styles.container}>
        <Button onPress={handlePaymentFlow} title="Google Pay" />
        <Image source={iamgeUrl} style={{height: 100, width: 100}} />
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Processing...</Text>
          </View>
        )}
      </SafeAreaView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default App;
