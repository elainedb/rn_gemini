import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Linking, Button, Modal, SafeAreaView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { youtubeApiKey } from '@/config.js';

const channelIds = [
  'UCynoa1DjwnvHAowA_jiMEAQ',
  'UCK0KOjX3beyB9nzonls0cuw',
  'UCACkIrvrGAQ7kuc0hMVwvmA',
  'UCtWRAKKvOEA0CXOue9BG8ZA',
];

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  publishedAt: string;
  tags: string[];
  location?: { city: string; country: string; latitude: number; longitude: number };
  recordingDate?: string;
}

const CACHE_KEY = 'videoCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunkedArr: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
}

const MainScreen = () => {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [channelMap, setChannelMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'publishedAt' | 'recordingDate'>('publishedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchVideos = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData && !forceRefresh) {
        const { timestamp, data, channels } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setVideos(data);
          setChannelMap(channels || {});
          setLoading(false);
          return;
        }
      }

      const channelDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet', id: channelIds.join(','), key: youtubeApiKey },
      });

      const newChannelMap: Record<string, string> = {};
      channelDetailsResponse.data.items.forEach((item: any) => {
        newChannelMap[item.id] = item.snippet.title;
      });
      setChannelMap(newChannelMap);

      let allVideos: Video[] = [];
      for (const channelId of channelIds) {
        let allVideoIdsForChannel: string[] = [];
        let nextPageToken: string | undefined = undefined;

                  let searchResponse: any;
                  do {
                    searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {            params: {
              part: 'id',
              channelId,
              maxResults: 50, // Max allowed per page
              order: 'date',
              key: youtubeApiKey,
              pageToken: nextPageToken,
            },
          });

          allVideoIdsForChannel.push(...searchResponse.data.items
            .filter((item: any) => item.id.kind === 'youtube#video')
            .map((item: any) => item.id.videoId));
          nextPageToken = searchResponse.data.nextPageToken;
        } while (nextPageToken);

        // Fetch details for all video IDs, in chunks of 50
        const videoIdChunks = chunkArray(allVideoIdsForChannel, 50);

        for (const chunk of videoIdChunks) {
          const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: { part: 'snippet,recordingDetails', id: chunk.join(','), key: youtubeApiKey },
          });

          const channelVideosPromises = videoResponse.data.items.map(async (item: any) => {
            let locationData;
            if (item.recordingDetails?.location) {
              const { latitude, longitude } = item.recordingDetails.location;
              try {
                const geoResponse = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                locationData = {
                  city: geoResponse.data.city,
                  country: geoResponse.data.countryName,
                  latitude,
                  longitude,
                };
              } catch (geoError) {
                console.error('Reverse geocoding error:', geoError);
              }
            }

            return {
              id: item.id,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.default.url,
              channel: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
              tags: item.snippet.tags || [],
              location: locationData,
              recordingDate: item.recordingDetails?.recordingDate,
            };
          });

          const channelVideos = await Promise.all(channelVideosPromises);
          allVideos = [...allVideos, ...channelVideos];
        }
      }
      
      setVideos(allVideos);
      const countries = [...new Set(allVideos.map(v => v.location?.country).filter(Boolean)) as Set<string>];
      setUniqueCountries(countries);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: allVideos, channels: newChannelMap }));

    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];
    if (filterChannel) {
      result = result.filter(v => v.channel === filterChannel);
    }
    if (filterCountry) {
      result = result.filter(v => v.location?.country === filterCountry);
    }

    result.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (!valA || !valB) return 0;
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [videos, filterChannel, filterCountry, sortBy, sortOrder]);

  const handleRefresh = async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
    fetchVideos(true);
  };

  const renderVideo = ({ item }: { item: Video }) => (
    <TouchableOpacity style={styles.videoItem} onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${item.id}`)}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.channel}>{item.channel}</Text>
        <Text style={styles.date}>Published: {new Date(item.publishedAt).toLocaleDateString()}</Text>
        {item.recordingDate && <Text style={styles.date}>Recorded: {new Date(item.recordingDate).toLocaleDateString()}</Text>}
        {item.tags && item.tags.length > 0 && <Text style={styles.tags}>Tags: {item.tags.join(', ')}</Text>}
        {item.location && (
          <Text style={styles.location}>
            Location: {item.location.city}, {item.location.country} ({item.location.latitude.toFixed(2)}, {item.location.longitude.toFixed(2)})
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controls}>
        <Button title="Refresh" onPress={handleRefresh} />
        <Button title="Filter" onPress={() => setFilterModalVisible(true)} />
        <Button title="Sort" onPress={() => setSortModalVisible(true)} />
        <Button title="View Map" onPress={() => router.push('/map')} />
      </View>

      <View style={styles.listHeader}>
        <Text>Total Videos: {filteredAndSortedVideos.length}</Text>
      </View>

      {loading ? <Text>Loading...</Text> : <FlatList data={filteredAndSortedVideos} renderItem={renderVideo} keyExtractor={item => item.id} />}

      <Modal visible={filterModalVisible} transparent={true} onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Channel</Text>
            {Object.keys(channelMap || {}).map(channelId => (
              <View key={channelId} style={styles.modalButton}>
                <Button title={channelMap[channelId]} onPress={() => { setFilterChannel(channelMap[channelId]); setFilterModalVisible(false); }} />
              </View>
            ))}
            <View style={styles.modalButton}>
              <Button title="Clear Channel Filter" onPress={() => { setFilterChannel(null); setFilterModalVisible(false); }} />
            </View>
            <Text style={styles.modalTitle}>Filter by Country</Text>
            {uniqueCountries.map(country => (
              <View key={country} style={styles.modalButton}>
                <Button title={country} onPress={() => { setFilterCountry(country); setFilterModalVisible(false); }} />
              </View>
            ))}
            <View style={styles.modalButton}>
              <Button title="Clear Country Filter" onPress={() => { setFilterCountry(null); setFilterModalVisible(false); }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={sortModalVisible} transparent={true} onRequestClose={() => setSortModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Options</Text>
            <View style={styles.modalButton}>
              <Button title="Publication Date (Newest)" onPress={() => { setSortBy('publishedAt'); setSortOrder('desc'); setSortModalVisible(false); }} />
            </View>
            <View style={styles.modalButton}>
              <Button title="Publication Date (Oldest)" onPress={() => { setSortBy('publishedAt'); setSortOrder('asc'); setSortModalVisible(false); }} />
            </View>
            <View style={styles.modalButton}>
              <Button title="Recording Date (Newest)" onPress={() => { setSortBy('recordingDate'); setSortOrder('desc'); setSortModalVisible(false); }} />
            </View>
            <View style={styles.modalButton}>
              <Button title="Recording Date (Oldest)" onPress={() => { setSortBy('recordingDate'); setSortOrder('asc'); setSortModalVisible(false); }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 10 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  listHeader: { alignItems: 'center', paddingVertical: 8 },
  videoItem: { flexDirection: 'row', marginBottom: 10 },
  thumbnail: { width: 120, height: 90 },
  videoInfo: { marginLeft: 10, flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  channel: { fontSize: 14, color: 'gray' },
  date: { fontSize: 12, color: 'gray' },
  tags: { fontSize: 10, color: 'blue', marginTop: 5 },
  location: { fontSize: 10, color: 'green' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalButton: { marginTop: 10 },
});

export default MainScreen;