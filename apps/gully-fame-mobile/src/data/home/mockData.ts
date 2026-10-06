import { categoriesFullData } from "@/types/categories";
import {
  competitionsDataFromAPI,
  competitionsFullData,
} from "@/types/competitions";
import { homePageHeroSlidesAPIData } from "@/types/homePageHeroSlides";
import { topPerformersForHomeScreenFullData } from "@/types/topDancers";
import { trendingReelsHomePageFullData } from "@/types/trendingReelsHomePage";

export const upcomingCompetitionsMock: competitionsFullData[] = [
  {
    id: 1,
    title: "Hip-Hop Championship 2...",
    prize: 100000,
    dayLeft: 5,
    people: 500,
    participants: 500,
    entryFee: 0,
    defaultThumbnailImage: require("@assets/images/trending_reel1.png"),
    status: "UPCOMING",
  },
  {
    id: 2,
    title: "Cooking Wars",
    prize: 50000,
    dayLeft: 5,
    people: 500,
    participants: 500,
    entryFee: 0,
    defaultThumbnailImage: require("@assets/images/trending_reel2.png"),
    status: "UPCOMING",
  },
  {
    id: 3,
    title: "Sangeet K",
    prize: 50000,
    participants: 500,
    dayLeft: 5,
    people: 500,
    entryFee: 0,
    defaultThumbnailImage: require("@assets/images/trending_reel3.png"),
    status: "UPCOMING",
  },
];

export const pastCompetitionsMock: competitionsDataFromAPI[] = [
  {
    id: 1,
    title: "Hip-Hop Championship 2...",
    winner: "Avinesh",
    views: "5.2M",

    status: "COMPLETED",
  },
  {
    id: 2,
    title: "Cooking Wars",
    winner: "Avinesh",
    views: "5.2M",

    status: "COMPLETED",
  },
  {
    id: 3,
    title: "Sangeet K",
    winner: "Avinesh",
    views: "5.2M",

    status: "COMPLETED",
  },
];

export const topDancers: topPerformersForHomeScreenFullData[] = [
  {
    id: 1,
    rank: 1,
    name: "Aarav",
    label: "Top Performer",
    points: 25000,
    votes: 25000,
    defaultProfilePicture: require("@assets/images/user1.png"),
    badge: "🥇",
    userId: "aarav1",
  },
  {
    id: 2,
    rank: 2,
    name: "Alex",
    label: "Fan Favorite",
    points: 18500,
    votes: 18500,
    defaultProfilePicture: require("@assets/images/user2.png"),
    badge: "🥈",
    userId: "alex1",
  },
  {
    id: 3,
    rank: 3,
    name: "Bob",
    label: "Rising Star",
    points: 15200,
    votes: 15200,
    defaultProfilePicture: require("@assets/images/user1.png"),
    badge: "🥉",
    userId: "bob1",
  },
];
export const fallbackCategories: categoriesFullData[] = [
  { id: 1, name: "Dance", icon: "dance" },
  { id: 2, name: "Music", icon: "music" },
  { id: 3, name: "Comedy", icon: "comedy" },
  { id: 4, name: "Cook", icon: "cook" },
];
// Sample data
export const heroSlides: homePageHeroSlidesAPIData[] = [
  {
    id: 1,
    title: "Join Gully Fame India",
    subtitle: "Your stage awaits",
    image: "/test.jpg",
  },
  {
    id: 2,
    title: "Showcase Your Dance Talent",
    subtitle: "Let the world see your moves",
    image: "/test.jpg",
  },
  {
    id: 3,
    title: "Become the Next Star of Delhi",
    subtitle: "Rise to fame today",
    image: "/test.jpg",
  },
];

// Category Icons - Using Images

export const trendingReels: trendingReelsHomePageFullData[] = [
  {
    id: 1,
    rank: 1,
    creatorUsername: "@Suhani0098000",
    title: "Dance-Off Delhi",
    views: 214000,
    likes: 134,
    defaultThumbnailImage: require("@assets/images/trending1.png"),
  },
  {
    id: 2,
    rank: 2,
    creatorUsername: "@DancerPro",
    title: "Gully Chef Wars",
    views: 214000,
    likes: 134,
    defaultThumbnailImage: require("@assets/images/trending2.png"),
  },
  {
    id: 3,
    rank: 3,
    creatorUsername: "@ChefMaster",
    title: "Mic-Drop",
    views: 214000,
    likes: 134,
    defaultThumbnailImage: require("@assets/images/trending3.png"),
  },
];
export const trendingCompetitions = [
  {
    id: 1,
    title: "Dance-Off Delhi",
    participants: 234,
    prize: "₹50,000",
    image: require("@assets/images/trending1.png"),
    status: "Live",
  },
  {
    id: 2,
    title: "Freestyle Battle",
    participants: 189,
    prize: "₹30,000",
    image: require("@assets/images/trending2.png"),
    status: "Live",
  },
];
