import Constants from 'expo-constants';

let resolvedApiUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

if (!process.env.EXPO_PUBLIC_DOMAIN && Constants.expoConfig?.hostUri) {
  const localIp = Constants.expoConfig.hostUri.split(':')[0];
  resolvedApiUrl = `http://${localIp}:3000`;
}

export const API_URL = resolvedApiUrl;
