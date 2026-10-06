// Created by Kiro
// Competition Context - Manage competitions state globally

import React, { createContext, useContext, useState, useCallback } from 'react';
import { competitionService, type Competition as ApiCompetition } from '../api/services/competitionService';

export interface Competition {
  id: string;
  title: string;
  description: string;
  image?: string;
  participants?: number;
  prize?: string;
  status?: 'active' | 'upcoming' | 'ended';
  startDate?: string;
  endDate?: string;
  rules?: string;
}

const mapCompetition = (competition: ApiCompetition): Competition => ({
  id: competition._id,
  title: competition.title,
  description: competition.description,
  participants: competition.participants?.length ?? 0,
  prize: String(competition.prizePool ?? 0),
  status: competition.status === 'live' || competition.status === 'APPROVED'
    ? 'active'
    : competition.status === 'CREATED'
      ? 'upcoming'
      : 'ended',
  startDate: competition.startDate,
  endDate: competition.endDate,
});

interface CompetitionContextType {
  // State
  competitions: Competition[];
  filteredCompetitions: Competition[];
  selectedCompetition: Competition | null;
  loading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  selectedFilter: 'all' | 'active' | 'upcoming' | 'ended';

  // Actions
  fetchCompetitions: () => Promise<void>;
  fetchCompetitionById: (id: string) => Promise<Competition | null>;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: 'all' | 'active' | 'upcoming' | 'ended') => void;
  filterCompetitions: () => void;
  clearFilters: () => void;
  clearError: () => void;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

export const CompetitionProvider = ({ children }: { children: React.ReactNode }) => {
  // State
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

  // Fetch all competitions
  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await competitionService.getCompetitions();

      if (result.success && result.data) {
        setCompetitions(result.data.items.map(mapCompetition));
        filterCompetitions();
      } else {
        setError(result.error || 'Failed to fetch competitions');
      }
    } catch (err: any) {
      console.error('Error fetching competitions:', err);
      setError(err.message || 'Failed to fetch competitions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single competition by ID
  const fetchCompetitionById = useCallback(
    async (id: string): Promise<Competition | null> => {
      try {
        setLoading(true);
        setError(null);

        // Find in existing competitions first
        const existing = competitions.find((c) => c.id === id);
        if (existing) {
          setSelectedCompetition(existing);
          return existing;
        }

        // If not found, fetch from API
        const result = await competitionService.getCompetitions();
        if (result.success && result.data) {
          const competition = result.data.items.find((c) => c._id === id);
          if (competition) {
            const mappedCompetition = mapCompetition(competition);
            setSelectedCompetition(mappedCompetition);
            return mappedCompetition;
          }
        }

        setError('Competition not found');
        return null;
      } catch (err: any) {
        console.error('Error fetching competition:', err);
        setError(err.message || 'Failed to fetch competition');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [competitions]
  );

  // Filter competitions based on search and status
  const filterCompetitions = useCallback(() => {
    let filtered = competitions;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((comp) => comp.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((comp) =>
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCompetitions(filtered);
  }, [competitions, searchQuery, selectedFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFilter('all');
    setFilteredCompetitions(competitions);
  }, [competitions]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update filtered competitions when filters change
  React.useEffect(() => {
    filterCompetitions();
  }, [searchQuery, selectedFilter, competitions, filterCompetitions]);

  const value: CompetitionContextType = {
    // State
    competitions,
    filteredCompetitions,
    selectedCompetition,
    loading,
    error,

    // Filters
    searchQuery,
    selectedFilter,

    // Actions
    fetchCompetitions,
    fetchCompetitionById,
    setSearchQuery,
    setSelectedFilter,
    filterCompetitions,
    clearFilters,
    clearError,
  };

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
};

// Custom hook to use CompetitionContext
export const useCompetition = () => {
  const context = useContext(CompetitionContext);
  if (context === undefined) {
    throw new Error('useCompetition must be used within CompetitionProvider');
  }
  return context;
};
