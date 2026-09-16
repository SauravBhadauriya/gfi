/**
 * Instagram-Style Post Screen
 * Upload reel with caption, hashtags, tags, location
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gullyfame.com/api';

// ============================================================================
// TYPES
// ============================================================================

type Visibility = 'public' | 'followers' | 'private';

interface HashtagSuggestion {
  tag: string;
  count: number;
}

interface UserSuggestion {
  id: string;
  username: string;
  avatar: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PostScreen() {
  const params = useLocalSearchParams();

  // Form state
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<UserSuggestion[]>([]);
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowRemix, setAllowRemix] = useState(true);

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const charLimit = 2200;
  const remainingChars = charLimit - caption.length;

  // =========================================================================
  // HASHTAG HANDLING
  // =========================================================================

  const handleCaptionChange = async (text: string) => {
    setCaption(text);

    // Extract hashtags from caption
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches) {
      const tags = hashtagMatches.map(tag => tag.slice(1));
      setHashtags(tags);

      // Fetch suggestions for last hashtag
      const lastHashtag = tags[tags.length - 1];
      if (lastHashtag && lastHashtag.length > 1) {
        await fetchHashtagSuggestions(lastHashtag);
      }
    }
  };

  const fetchHashtagSuggestions = async (query: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/hashtags`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data?.hashtags) {
        setHashtagSuggestions(response.data.hashtags.slice(0, 5));
        setShowHashtagSuggestions(true);
      }
    } catch (error) {
      console.error('[Post] Hashtag fetch error:', error);
    }
  };

  const addHashtag = (tag: string) => {
    const newCaption = caption.replace(/#\w*$/, `#${tag} `);
    setCaption(newCaption);
    setShowHashtagSuggestions(false);
  };

  // =========================================================================
  // USER TAGGING
  // =========================================================================

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/users/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data?.users) {
        setUserSuggestions(response.data.users.slice(0, 10));
      }
    } catch (error) {
      console.error('[Post] User search error:', error);
    }
  };

  const tagUser = (user: UserSuggestion) => {
    if (!taggedUsers.find(u => u.id === user.id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
    setShowUserSearch(false);
  };

  const removeTag = (userId: string) => {
    setTaggedUsers(taggedUsers.filter(u => u.id !== userId));
  };

  // =========================================================================
  // UPLOAD
  // =========================================================================

  const handleUpload = async () => {
    if (!caption.trim() && hashtags.length === 0) {
      Alert.alert('Caption Required', 'Please add a caption or hashtags');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Not authenticated');
        router.replace('/(auth)/login');
        return;
      }

      // Parse video data from params
      const clips = JSON.parse(params.clips as string || '[]');
      
      if (clips.length === 0) {
        Alert.alert('Error', 'No video clips found');
        return;
      }

      // Prepare form data
      const formData = new FormData();

      // Add video file(s)
      clips.forEach((clip: any, index: number) => {
        formData.append('video', {
          uri: clip.uri,
          type: 'video/mp4',
          name: `clip-${index}.mp4`,
        } as any);
      });

      // Add metadata
      formData.append('caption', caption);
      formData.append('hashtags', JSON.stringify(hashtags));
      formData.append('tagged_users', JSON.stringify(taggedUsers.map(u => u.id)));
      formData.append('location', location);
      formData.append('visibility', visibility);
      formData.append('allow_comments', allowComments.toString());
      formData.append('allow_duet', allowDuet.toString());
      formData.append('allow_remix', allowRemix.toString());
      
      if (params.audioId) {
        formData.append('music_id', params.audioId as string);
      }
      
      if (params.filter && params.filter !== 'none') {
        formData.append('filter', params.filter as string);
      }

      // Calculate total duration
      const totalDuration = clips.reduce((sum: number, clip: any) => 
        sum + (clip.duration || 0), 0
      );
      formData.append('duration', totalDuration.toString());

      // Upload with progress tracking
      const response = await axios.post(`${API_BASE_URL}/reels/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
          }
        },
        timeout: 300000, // 5 minutes
      });

      if (response.data?.reel) {
        Alert.alert('Success', 'Your reel has been posted!', [
          {
            text: 'View',
            onPress: () => router.replace(`/(main)/reels/${response.data.reel.id}`),
          },
          {
            text: 'Profile',
            onPress: () => router.replace('/(tabs)/profile'),
          },
        ]);
      }

    } catch (error: any) {
      console.error('[Post] Upload error:', error);
      
      let errorMessage = 'Failed to upload reel';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Upload Failed', errorMessage, [
        { text: 'Retry', onPress: handleUpload },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Video Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <View style={styles.thumbnail}>
            <Ionicons name="videocam" size={48} color="#666" />
            <Text style={styles.thumbnailText}>Your Reel</Text>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#666"
            multiline
            maxLength={charLimit}
            value={caption}
            onChangeText={handleCaptionChange}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, remainingChars < 100 && styles.charCountWarning]}>
            {remainingChars} characters remaining
          </Text>
        </View>

        {/* Hashtag Suggestions */}
        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Suggested Hashtags</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {hashtagSuggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => addHashtag(suggestion.tag)}
                >
                  <Text style={styles.suggestionText}>#{suggestion.tag}</Text>
                  <Text style={styles.suggestionCount}>{suggestion.count}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tag People */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setShowUserSearch(!showUserSearch)}
        >
          <View style={styles.sectionRow}>
            <Ionicons name="person-add" size={20} color="#EC9A15" />
            <Text style={styles.sectionLabel}>Tag People</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          {taggedUsers.length > 0 && (
            <View style={styles.taggedUsers}>
              {taggedUsers.map(user => (
                <View key={user.id} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>@{user.username}</Text>
                  <TouchableOpacity onPress={() => removeTag(user.id)}>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Ionicons name="location" size={20} color="#EC9A15" />
            <TextInput
              style={styles.inlineInput}
              placeholder="Add location"
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Who can watch this</Text>
          <View style={styles.visibilityOptions}>
            {(['public', 'followers', 'private'] as Visibility[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.visibilityOption,
                  visibility === option && styles.visibilityOptionActive
                ]}
                onPress={() => setVisibility(option)}
              >
                <Ionicons
                  name={
                    option === 'public' ? 'globe' :
                    option === 'followers' ? 'people' : 'lock-closed'
                  }
                  size={20}
                  color={visibility === option ? '#000' : '#fff'}
                />
                <Text style={[
                  styles.visibilityText,
                  visibility === option && styles.visibilityTextActive
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Advanced Settings */}
        <TouchableOpacity
          style={styles.section}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Advanced Settings</Text>
            <Ionicons
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedSettings}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allow Comments</Text>
              <TouchableOpacity
                style={[styles.toggle, allowComments && styles.toggleActive]}
                onPress={() => setAllowComments(!allowComments)}
              >
                <View style={[styles.toggleThumb, allowComments && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allow Duet</Text>
              <TouchableOpacity
                style={[styles.toggle, allowDuet && styles.toggleActive]}
                onPress={() => setAllowDuet(!allowDuet)}
              >
                <View style={[styles.toggleThumb, allowDuet && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allow Remix</Text>
              <TouchableOpacity
                style={[styles.toggle, allowRemix && styles.toggleActive]}
                onPress={() => setAllowRemix(!allowRemix)}
              >
                <View style={[styles.toggleThumb, allowRemix && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Button */}
      <View style={styles.footer}>
        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#EC9A15" />
            <Text style={styles.uploadingText}>Uploading {uploadProgress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Text style={styles.uploadButtonText}>Post</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    padding: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 120,
    height: 160,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EC9A15',
  },
  thumbnailText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captionInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 15,
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  charCountWarning: {
    color: '#ff9500',
  },
  suggestions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  suggestionsTitle: {
    color: '#EC9A15',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 13,
  },
  suggestionCount: {
    color: '#666',
    fontSize: 11,
  },
  taggedUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EC9A15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
  inlineInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  visibilityOptionActive: {
    backgroundColor: '#EC9A15',
    borderColor: '#EC9A15',
  },
  visibilityText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  visibilityTextActive: {
    color: '#000',
  },
  advancedSettings: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 15,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#EC9A15',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  uploadButton: {
    backgroundColor: '#EC9A15',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#EC9A15',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC9A15',
    borderRadius: 2,
  },
});
