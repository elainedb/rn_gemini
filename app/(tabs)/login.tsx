
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';

import { AUTHORIZED_EMAILS } from '@/config.js';

const authorizedEmails = AUTHORIZED_EMAILS.split(',');

export default function LoginScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '83953880984-7n5mp2qaj2i9nqom6gohaqht00a88rbb.apps.googleusercontent.com', // client ID of type WEB for your server. Required to get the idToken on the user object
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const userEmail = userInfo.data?.user?.email;

      if (userEmail && authorizedEmails.includes(userEmail)) {
        console.log(`Access granted to ${userEmail}`);
        router.replace({ pathname: '/(tabs)/main' as any });
      } else {
        setError("Access denied. Your email is not authorized.");
        await GoogleSignin.signOut();
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login with Google</Text>
      <GoogleSigninButton
        style={{ width: 192, height: 48 }}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signIn}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  error: {
    marginTop: 20,
    color: 'red',
  },
});
