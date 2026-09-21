// creta by kiro

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  useFocusEffect,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/services/authService';
import { userService } from '../api/services/userService';
import { useFollowStats } from '../hooks/useFollowStats';
import { useUserReels } from '../hooks/useUserReels';
import InstagramStyleVideoGrid from '../components/profile/InstagramStyleVideoGrid';
import Ionicons from '@expo/vector-icons/Ionicons';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: string;
  profileImage?: string;
  gender?: string;
  dob?: string;
  bio?: string;
}

export default function ProfileScreen({ navigation, route }: any) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get user ID from route or use own profile
  const isPublicProfile = !!route?.params?.userId;
  const userId = route?.params?.userId || 'me';
  
  // Fetch reels for current user
  const { reels, loading: reelsLoading, refetch: refetchReels } = useUserReels(userId);
  
  // Fetch follow stats for current user
  const { stats: followStats, loading: statsLoading, refetch: refetchStats } = useFollowStats(userId);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  // Refetch profile when screen regains focus
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      refetchReels();
      refetchStats();
    }, [userId, refetchReels, refetchStats])
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // For own profile, use authService
      if (!isPublicProfile) {
        const result = await authService.getUserProfile();
        if (result.success && result.data) {
          setProfile(result.data as UserProfile);
        } else {
          Alert.alert('Error', result.error || 'Failed to load profile');
        }
      } else {
        // For public profile, use userService
        const result = await userService.getPublicUserProfile(userId);
        if (result.success && result.data) {
          setProfile(result.data as UserProfile);
        } else {
          Alert.alert('Error', result.error || 'Failed to load user profile');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), refetchReels(), refetchStats()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    // Only show logout on own profile
    if (isPublicProfile) return;
    
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditProfile = () => {
    // Only allow edit on own profile
    if (!isPublicProfile && profile) {
      navigation.navigate('EditProfile', { profile });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchUserProfile}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profile.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color="#007AFF" />
              </View>
            )}
          </View>

          <Text style={styles.profileName}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.profileRole}>
            {profile.role === 'participants' ? 'Participant' : 'Fan'}
          </Text>
        </View>

        {/* Profile Stats Header */}
        {statsLoading ? (
          <View style={styles.statsSection}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.statsSection}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{reels.length}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{followStats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{followStats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        )}

        {/* Reels Grid Section */}
        {reels.length > 0 && (
          <View style={styles.reelsSection}>
            <Text style={styles.reelsSectionTitle}>Videos</Text>
            <InstagramStyleVideoGrid 
              reels={reels} 
              loading={reelsLoading}
              userId={userId}
              onRefresh={refetchReels}
            />
          </View>
        )}

        {/* Profile Info Cards */}
        <View style={styles.infoSection}>
          {/* Email Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <Ionicons name="mail" size={24} color="#007AFF" />
              <View style={styles.infoCardText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>
          </View>

          {/* Mobile Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <Ionicons name="call" size={24} color="#007AFF" />
              <View style={styles.infoCardText}>
                <Text style={styles.infoLabel}>Mobile</Text>
                <Text style={styles.infoValue}>{profile.mobile}</Text>
              </View>
            </View>
          </View>

          {/* Gender Card (if available) */}
          {profile.gender && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardLeft}>
                <Ionicons name="person-circle" size={24} color="#007AFF" />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>
                    {profile.gender.charAt(0).toUpperCase() +
                      profile.gender.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* DOB Card (if available) */}
          {profile.dob && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardLeft}>
                <Ionicons name="calendar" size={24} color="#007AFF" />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoLabel}>Date of Birth</Text>
                  <Text style={styles.infoValue}>
                    {new Date(profile.dob).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bio Card (if available) */}
          {profile.bio && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardLeft}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{profile.bio}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!isPublicProfile && (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings" size={20} color="#007AFF" />
                <Text style={styles.settingsButtonText}>Settings</Text>
              </TouchableOpacity>
            </>
          )}

          {!isPublicProfile && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer Spacing */}
        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  reelsSection: {
    marginVertical: 16,
  },
  reelsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoCardText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  settingsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerSpacing: {
    height: 20,
  },
});
