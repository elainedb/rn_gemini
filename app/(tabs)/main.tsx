
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import axios from 'axios';
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
}

const MainScreen = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const allVideos = [];
        for (const channelId of channelIds) {
          const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              part: 'snippet',
              channelId: channelId,
              maxResults: 10,
              order: 'date',
              key: youtubeApiKey,
            },
          });

          const channelVideos = response.data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url,
            channel: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
          }));
          allVideos.push(...channelVideos);
        }

        allVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setVideos(allVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const renderVideo = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${item.id}`)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.channel}>{item.channel}</Text>
        <Text style={styles.date}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  videoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  thumbnail: {
    width: 120,
    height: 90,
  },
  videoInfo: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  channel: {
    fontSize: 14,
    color: 'gray',
  },
  date: {
    fontSize: 12,
    color: 'gray',
  },
});

export default MainScreen;
