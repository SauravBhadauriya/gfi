import { ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type TalentCategory = {
  key: string;
  name: string;
  tagline: string;
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
};

export const TALENT_CATEGORIES: TalentCategory[] = [
  { key: "music", name: "Music", tagline: "Mic-Drop", icon: "music-note", description: "Singing, covers, rap, beatboxing, original songs, and lip-sync videos." },
  { key: "dance", name: "Dance", tagline: "Dance-Off", icon: "human-female-dance", description: "Dance challenges, choreography, trending moves, and dance battles." },
  { key: "comedy", name: "Comedy", tagline: "Open Mic", icon: "emoticon-happy-outline", description: "Relatable jokes, memes, POVs, roasts, and funny skits." },
  { key: "food", name: "Food", tagline: "Foodie Mode", icon: "noodles", description: "Street food, recipes, food reviews, and cooking challenges." },
  { key: "fashion", name: "Fashion & Beauty", tagline: "Fit Check", icon: "hanger", description: "Outfit transitions, streetwear, GRWM, makeup, and styling tips." },
  { key: "lifestyle", name: "Lifestyle", tagline: "Main Character", icon: "star-four-points-outline", description: "Daily life, college moments, friendships, routines, and mini-vlogs." },
  { key: "travel", name: "Travel & Adventure", tagline: "Out of Office", icon: "airplane", description: "Hidden places, road trips, local experiences, and travel diaries." },
  { key: "gaming", name: "Gaming", tagline: "GG Zone", icon: "controller-classic-outline", description: "Gameplay highlights, funny fails, esports, and gaming challenges." },
  { key: "fitness", name: "Fitness & Sports", tagline: "Beast Mode", icon: "dumbbell", description: "Gym routines, cricket, football, sports tricks, and fitness challenges." },
  { key: "tech", name: "Tech & Gadgets", tagline: "Tech Drop", icon: "robot-outline", description: "AI tools, gadget reviews, app discoveries, and tech hacks." },
  { key: "college", name: "College & Campus", tagline: "Campus Chaos", icon: "school-outline", description: "College life, hostel stories, campus humor, and student culture." },
  { key: "art", name: "Art & Creativity", tagline: "Create Mode", icon: "palette-outline", description: "Drawing, photography, DIY, editing tricks, and creative transformations." },
];
