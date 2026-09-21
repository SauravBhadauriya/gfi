// Created by Kiro
// Home Screen - Displays competitions, banners, and categories

import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { competitionService } from '../api/services/competitionService';
import { bannerService } from '../api/services/bannerService';
import { categoryService } from '../api/services/categoryService';
import { leaderboardService, TopPerformer } from '../api/services/leaderboardService';

interface Competition {
  id: string;
  title: string;
  description: string;
  image?: string;
  participants?: number;
  prize?: string;
}

interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

export default function HomeScreen({ navigation }: any) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Fetch all home data
  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [competitionsRes, bannersRes, categoriesRes, topPerformersRes] = await Promise.all([
        competitionService.getCompetitions(),
        bannerService.getActiveBanners(),
        categoryService.getCategories(),
        leaderboardService.getTopPerformers({ limit: 10 }),
      ]);

      if (competitionsRes.success && competitionsRes.data) {
        setCompetitions(((competitionsRes.data as any).items || competitionsRes.data) as any);
      }
      if (bannersRes.success && bannersRes.data) {
        setBanners(((bannersRes.data as any).items || bannersRes.data) as any);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(((categoriesRes.data as any).items || categoriesRes.data) as any);
      }
      if (topPerformersRes.success && topPerformersRes.data) {
        setTopPerformers(topPerformersRes.data as any);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      Alert.alert('Error', 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  // Handle competition tap
  const handleCompetitionTap = (competition: Competition) => {
    navigation.navigate('CompetitionDetail', { competition });
  };

  // Filter competitions based on search
  const filteredCompetitions = competitions.filter((comp) =>
    comp.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading home...</Text>
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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <Text
            style={styles.searchInput}
            onPress={() => {
              /* Search functionality */
            }}
          >
            Search competitions...
          </Text>
        </View>

        {/* Banners Section */}
        {banners.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bannersScroll}
            >
              {banners.map((banner) => (
                <TouchableOpacity
                  key={banner.id}
                  style={styles.bannerCard}
                  onPress={() => {
                    /* Handle banner tap */
                  }}
                >
                  {banner.image ? (
                    <Image
                      source={{ uri: banner.image }}
                      style={styles.bannerImage}
                    />
                  ) : (
                    <View style={styles.bannerPlaceholder}>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => {
                    /* Filter by category */
                  }}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name="star" size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Top Performers Section */}
        {topPerformers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.topPerformersContainer}>
              {topPerformers.slice(0, 5).map((performer, index) => (
                <TouchableOpacity
                  key={performer.id || index}
                  style={styles.performerRow}
                  onPress={() => navigation.navigate('UserProfile', { userId: performer.userId })}
                >
                  <View style={styles.performerRank}>
                    <Text style={styles.performerRankText}>{performer.badge || performer.rank}</Text>
                  </View>
                  <Image
                    source={{ uri: performer.profileImage || 'https://via.placeholder.com/40' }}
                    style={styles.performerAvatar}
                  />
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{performer.name}</Text>
                    {performer.isVerified && (
                      <Ionicons name="checkmark-circle" size={12} color="#007AFF" style={styles.verifiedBadge} />
                    )}
                  </View>
                  <View style={styles.performerPoints}>
                    <Text style={styles.performerPointsText}>{performer.points} pts</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Competitions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Competitions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllCompetitions')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((competition) => (
              <TouchableOpacity
                key={competition.id}
                style={styles.competitionCard}
                onPress={() => handleCompetitionTap(competition)}
              >
                {competition.image && (
                  <Image
                    source={{ uri: competition.image }}
                    style={styles.competitionImage}
                  />
                )}
                <View style={styles.competitionInfo}>
                  <Text style={styles.competitionTitle}>{competition.title}</Text>
                  <Text style={styles.competitionDesc} numberOfLines={2}>
                    {competition.description}
                  </Text>
                  <View style={styles.competitionMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={16} color="#007AFF" />
                      <Text style={styles.metaText}>
                        {competition.participants || 0} participants
                      </Text>
                    </View>
                    {competition.prize && (
                      <View style={styles.metaItem}>
                        <Ionicons name="gift" size={16} color="#FFB800" />
                        <Text style={styles.metaText}>{competition.prize}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No competitions found</Text>
            </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  bannersScroll: {
    paddingHorizontal: 16,
  },
  bannerCard: {
    width: 280,
    height: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: '48%',
    marginRight: '4%',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  competitionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  competitionImage: {
    width: 80,
    height: 80,
  },
  competitionInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  competitionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  competitionDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  competitionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  footerSpacing: {
    height: 20,
  },
  topPerformersContainer: {
    paddingHorizontal: 16,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  performerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  performerRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  performerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  performerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  performerPoints: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  performerPointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
});
