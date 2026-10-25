import { apiGet } from "../client";
import type { Progress } from "./userService";

/** GET /user/homeScreen - everything the home screen shows, in one call. */

export interface HomeBanner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export interface HomeCategory {
  id: string;
  name: string;
  icon: string;
}

export interface HomeTrendingReel {
  id: string;
  title: string;
  /** The backend fills this with the reel's vote count. */
  views: number;
  image: string;
  likes: number;
}

export interface HomeCompetition {
  id: string;
  title: string;
  image: string;
  prize?: number;
  startDate?: string;
  endDate?: string;
  participants?: number;
  views?: number;
}

export interface HomeTopCompetitor {
  rank: number;
  name: string;
  points: number;
  image: string;
}

export interface HomeScreenData {
  banners: HomeBanner[];
  categories: HomeCategory[];
  trending: HomeTrendingReel[];
  upcomingCompetitions: HomeCompetition[];
  pastCompetitions: HomeCompetition[];
  topCompetitors: HomeTopCompetitor[];
  liveCompetitions: HomeCompetition[];
  progress: Progress | null;
  dailyMission: { target: number; current: number; completed: boolean };
}

export const getHomeScreen = () => apiGet<HomeScreenData>("user/homeScreen");
