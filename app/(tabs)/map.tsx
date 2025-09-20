
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const CACHE_KEY = 'videoCache';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  publishedAt: string;
  tags: string[];
  location?: { city:string; country: string; latitude: number; longitude: number };
  recordingDate?: string;
}

const MapScreen = () => {
  const [mapHtml, setMapHtml] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    const fetchVideosAndLoadHtml = async () => {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      let videosWithLocation: Video[] = [];
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        videosWithLocation = data.filter((video: Video) => video.location);
      }

      const asset = Asset.fromModule(require('@/assets/html/map.html'));
      await asset.downloadAsync();
      if (asset.localUri) {
        const htmlTemplate = await FileSystem.readAsStringAsync(asset.localUri);
        
        const injectedHtml = htmlTemplate.replace(
          "'__VIDEOS__'", 
          JSON.stringify(videosWithLocation)
        );
        setMapHtml(injectedHtml);
      }
    };

    fetchVideosAndLoadHtml();
  }, []);

  if (!mapHtml) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.map}
        source={{ html: mapHtml, baseUrl: '' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;
