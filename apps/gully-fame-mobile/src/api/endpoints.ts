
export const API_ENDPOINTS = {

  AUTH: {
    LOGIN: "auth/login",
    REGISTER: "auth/register",
    VERIFY_OTP: "auth/verifyOtp",
    RESEND_OTP: "auth/resendOtp",
    REFRESH_TOKEN: "auth/refresh-token",
    LOGOUT: "auth/logout",
    SOCIAL_LOGIN: "auth/login/social",
    FORGOT_PASSWORD: "auth/forgot-password",
    RESET_PASSWORD: "auth/reset-password",
  },


  USER: {
    PROFILE: "user/profile",
    UPDATE_PROFILE: "user/profile",
    CHANGE_PASSWORD: "user/change-password",
    GET_COMPETITIONS: "user/competitions",
    GET_CHAMPAIGNS: "user/champaigns",
    GET_CATEGORIES: "user/categories",
    HOME_SCREEN: "user/homeScreen",
    GET_FOLLOWERS: "user/followers",
    GET_FOLLOWING: "user/following",
    GET_EARNINGS: "user/earnings",
    GET_WALLET: "user/wallet",
    RECHARGE_WALLET: "user/wallet/recharge",
    GET_KYC: "user/kyc",
    GET_PROGRESS: "user/progress",
    GET_DAILY_MISSION: "user/daily-mission",
    SAVE_AUDIO: "user/audio/:audioId/save",
    GET_SAVED_AUDIO: "user/audio/saved",
  },

  // ==================== COMPETITION ENDPOINTS ====================
  COMPETITION: {
    GET_ALL: "competitions",
    GET_BY_ID: "competitions/:id",
    GET_BY_STATUS: "competitions/status/:status",
    JOIN: "competitions/:id/join",
    LEAVE: "competitions/:id/leave",
    GET_LEADERBOARD: "competitions/:id/leaderboard",
    GET_PARTICIPANTS: "competitions/:id/participants",
    INVITE: "competitions/:id/invite",
    GET_REELS: "competitions/:id/reels",
  },

  // ==================== REELS/VIDEOS ENDPOINTS ====================
  REELS: {
    GET_ALL: "reels",
    GET_BY_ID: "reels/:id",
    CREATE: "reels/create",
    UPDATE: "reels/:id/update",
    DELETE: "reels/:id/delete",
    ACTION: "reels/:id/action",
    LIKE: "reels/:id/action",
    UNLIKE: "reels/:id/action",
    GET_COMMENTS: "reels/:id/comments",
    ADD_COMMENT: "reels/:id/comments",
    DELETE_COMMENT: "reels/comments/:commentId",
    GET_UPLOAD_URL: "reels/upload-url",
    PUBLISH: "reels/publish",
    DRAFT: "reels/draft",
    AUTO_CAPTION: "reels/auto-caption",
    TIP: "reels/:id/tip",
    EXPORT: "reels/:id/export",
    EXPORT_STATUS: "reels/:id/export/status",
    GET_UPLOAD_STATUS: "reels/upload/:id/status",
    CANCEL_UPLOAD: "reels/upload/:id/cancel",
  },

  // ==================== BANNER ENDPOINTS ====================
  BANNER: {
    GET_ALL: "banners",
    GET_ACTIVE: "banners/active",
  },

  // ==================== CATEGORY ENDPOINTS ====================
  CATEGORY: {
    GET_ALL: "categories",
    GET_BY_ID: "categories/:id",
  },

  // ==================== KYC ENDPOINTS ====================
  KYC: {
    SUBMIT: "user/kyc",
    GET_STATUS: "user/kyc",
    UPDATE: "user/kyc",
  },

  // ==================== PAYMENT ENDPOINTS ====================
  PAYMENT: {
    CREATE_ORDER: "payments/create-order",
    VERIFY: "payments/verify",
    GET_HISTORY: "payments/history",
    INITIATE_RAZORPAY: "payments/razorpay/initiate",
    WEBHOOK_RAZORPAY: "payments/razorpay/webhook",
  },

  // ==================== FOLLOW ENDPOINTS ====================
  FOLLOW: {
    FOLLOW_USER: "user/:userId/follow",
    UNFOLLOW_USER: "user/:userId/follow",
    GET_FOLLOWERS: "user/followers",
    GET_FOLLOWING: "user/following",
    GET_FOLLOW_STATS: "user/:userId/follow-stats",
  },

  // ==================== COMMENT ENDPOINTS ====================
  COMMENT: {
    CREATE: "comments/create",
    DELETE: "comments/:id/delete",
    UPDATE: "comments/:id/update",
  },

  // ==================== SEARCH ENDPOINTS ====================
  SEARCH: {
    SEARCH_REELS: "search/reels",
    SEARCH_USERS: "search/users",
    SEARCH_COMPETITIONS: "search/competitions",
  },

  // ==================== NOTIFICATION ENDPOINTS ====================
  NOTIFICATION: {
    GET_ALL: "notification/notification",
    MARK_READ: "notification/:id/read",
    DELETE: "notification/:id/delete",
    MARK_ALL_READ: "notification/read-all",
  },

  // ==================== CHAT ENDPOINTS ====================
  CHAT: {
    GET_CONVERSATIONS: "chat/chatlist",
    SEND_MESSAGE: "chat/sendChat",
    GET_MESSAGES: "chat/chatDetails",
    DELETE_MESSAGE: "chat/message/delete",
    MARK_READ: "chat/read",
    TOGGLE_REACT: "chat/message/:id/react",
    ARCHIVE: "chat/archive",
  },

  // ==================== FEED ENDPOINTS ====================
  FEED: {
    GET_HOME_FEED: "feed/matrix",
    GET_TRENDING: "feed/trending",
    GET_FOLLOWING_FEED: "feed/following",
  },

  // ==================== BRANDING ENDPOINTS ====================
  BRANDING: {
    GET_LOGO: "branding/logo",
    GET_SPLASH: "branding/splash",
    GET_ONBOARDING: "branding/onboarding",
    GET_APP_CONFIG: "branding/config",
  },

  // ==================== ADMIN ENDPOINTS ====================
  ADMIN: {
    DASHBOARD: "admin/dashboard",
    GET_USERS: "admin/users",
    GET_REELS: "admin/reels",
    GET_REPORTS: "admin/reports",
    GET_EARNINGS: "admin/earnings",
    MODERATION: "admin/moderation",
  },

  // ==================== VIDEO EDITOR ENDPOINTS ====================
  VIDEO_EDITOR: {
    UPLOAD: "video-editor/upload",
    PROCESS: "video-editor/process",
    GET_STATUS: "video-editor/status/:id",
  },

  // ==================== MUSIC LIBRARY ENDPOINTS ====================
  MUSIC_LIBRARY: {
    LIST_AUDIO: "public/audio",
    LIST_FILTERS: "public/filters",
    LIST_STICKERS: "public/stickers",
    SEARCH_AUDIO: "public/audio/search",
  },

  // ==================== USER AUDIO ENDPOINTS ====================
  AUDIO: {
    TOGGLE_SAVE: "user/audio/:audioId/save",
    GET_SAVED: "user/audio/saved",
  },

  // ==================== CMS ENDPOINTS ====================
  CMS: {
    GET_PAGES: "cms/pages",
    GET_PAGE: "cms/pages/:slug",
    GET_TERMS: "cms/pages/terms-and-conditions",
    GET_PRIVACY: "cms/pages/privacy-policy",
  },

  // ==================== APP CONTENT ENDPOINTS ====================
  APP_CONTENT: {
    GET_HOME_SECTIONS: "app-content/home-sections",
    GET_FEATURED: "app-content/featured",
  },
} as const;

/**
 * Helper function to replace path parameters in endpoints
 * Usage: replaceParams(API_ENDPOINTS.REELS.GET_BY_ID, { id: "reel123" })
 */
export const replaceParams = (endpoint: string, params: Record<string, string | number>): string => {
  let result = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
};

export default API_ENDPOINTS;
