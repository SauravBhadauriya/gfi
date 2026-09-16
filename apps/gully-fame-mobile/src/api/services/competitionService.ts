import apiClient from '../axios';
import { ApiResponse } from '../types';

// ==================== Type Definitions ====================

export interface CompetitionSponsor {
  _id: string;
  email: string;
  sponsorCode?: string;
  [key: string]: any;
}

export interface CompetitionWinner {
  userId: string;
  rank: number;
  prize: number;
  _id: string;
  [key: string]: any;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    is_followed_by_me?: boolean;
  };
  reel?: {
    _id: string;
    thumbnail_url?: string;
    stats?: {
      votes?: number;
      likes?: number;
    };
  };
  votes?: number; // For backward compatibility
}

export interface LeaderboardResponse {
  page: number;
  limit: number;
  total: number;
  leaderboard: LeaderboardEntry[];
}

export interface Competition {
  _id: string;
  title: string;
  description: string;
  sponsorId?: CompetitionSponsor;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  status: 'CREATED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED' | 'live';
  participants: any[];
  isActive: boolean;
  isDeleted: boolean;
  winners: CompetitionWinner[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
  [key: string]: any;
}

export interface CompetitionsResponse {
  items: Competition[];
  total?: number;
}

// ==================== API Functions ====================

/**
 * Get all competitions
 * Spec: GET user/competitions?page=1&limit=20
 */
export async function getCompetitions(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<CompetitionsResponse>> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  
  try {
    console.log('[competitionService] GET user/competitions', { page, limit });
    
    const response = await apiClient.get<any>('user/competitions', {
      params: { page, limit },
    });
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      let competitions: Competition[] = [];
      
      if (Array.isArray(responseData.data)) {
        competitions = responseData.data;
      } else if (Array.isArray(responseData.data.items)) {
        competitions = responseData.data.items;
      } else if (Array.isArray(responseData.data.competitions)) {
        competitions = responseData.data.competitions;
      }

      const result: CompetitionsResponse = {
        items: competitions,
        total: responseData.data.total || competitions.length,
        page,
        limit,
      };

      console.log('[competitionService] GET user/competitions - Success:', competitions.length, 'competitions');
      return {
        success: true,
        data: result,
        message: responseData.message || 'Competitions fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch competitions',
      error: 'API returned unsuccessful response',
      data: {
        items: [],
        total: 0,
      },
    };
  } catch (error: any) {
    console.error('[competitionService] GET user/competitions error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        items: [],
        total: 0,
      },
    };
  }
}

/**
 * Get competition by ID
 */
export async function getCompetitionById(competitionId: string): Promise<ApiResponse<Competition>> {
  try {
    console.log('[competitionService] GET competitions/:id', { competitionId });
    
    // First get competitions, then find the one with matching ID
    const competitionsResponse = await getCompetitions({ page: 1, limit: 100 });
    
    if (competitionsResponse.success && competitionsResponse.data) {
      const competition = competitionsResponse.data.items.find(
        (comp) => comp._id === competitionId || comp.id === competitionId
      );
      
      if (competition) {
        return {
          success: true,
          data: competition,
          message: 'Competition fetched successfully',
        };
      }
    }

    return {
      success: false,
      message: 'Competition not found',
      error: 'NOT_FOUND',
      data: undefined,
    };
  } catch (error: any) {
    console.error('[competitionService] GET competitions/:id error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: undefined,
    };
  }
}

/**
 * Get competitions by status
 */
export async function getCompetitionsByStatus(
  status: 'CREATED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED' | 'live',
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<CompetitionsResponse>> {
  try {
    console.log('[competitionService] GET competitions by status', { status });
    
    const competitionsResponse = await getCompetitions(params);
    
    if (competitionsResponse.success && competitionsResponse.data) {
      const filteredCompetitions = competitionsResponse.data.items.filter(
        (comp) => comp.status === status
      );
      
      return {
        success: true,
        data: {
          items: filteredCompetitions,
          total: filteredCompetitions.length,
        },
        message: 'Competitions fetched successfully',
      };
    }

    return competitionsResponse;
  } catch (error: any) {
    console.error('[competitionService] GET competitions by status error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        items: [],
        total: 0,
      },
    };
  }
}

/**
 * Get competition leaderboard
 * Spec: GET competitions/{competitionId}/leaderboard?page=1&limit=20
 */
export async function getCompetitionLeaderboard(
  competitionId: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<LeaderboardResponse>> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  
  try {
    console.log('[competitionService] GET competitions/:id/leaderboard', { competitionId, page, limit });
    
    const response = await apiClient.get<any>(
      `competitions/${competitionId}/leaderboard`,
      { params: { page, limit } }
    );
    const responseData = response.data as any;

    if (responseData.code === 1 && responseData.data) {
      const data = responseData.data as LeaderboardResponse;
      
      console.log('[competitionService] GET leaderboard - Success:', data.leaderboard.length, 'entries');
      return {
        success: true,
        data,
        message: responseData.message || 'Leaderboard fetched successfully',
      };
    }

    return {
      success: false,
      message: responseData.message || 'Failed to fetch leaderboard',
      error: 'API returned unsuccessful response',
      data: {
        page: 1,
        limit: 20,
        total: 0,
        leaderboard: [],
      },
    };
  } catch (error: any) {
    console.error('[competitionService] GET leaderboard error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      error: error.message || 'Network error',
      data: {
        page: 1,
        limit: 20,
        total: 0,
        leaderboard: [],
      },
    };
  }
}

// ==================== Service Export ====================

export const competitionService = {
  getCompetitions,
  getCompetitionById,
  getCompetitionsByStatus,
  getCompetitionLeaderboard,
};

