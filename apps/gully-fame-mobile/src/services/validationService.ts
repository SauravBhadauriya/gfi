/**
 * Validation Service using Zod
 * Provides schemas and validation for common data types
 */

import { z } from 'zod';

/**
 * Authentication Schemas
 */
export const AuthSchemas = {
  loginRequest: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  signupRequest: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name required'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),

  refreshTokenRequest: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),

  forgotPasswordRequest: z.object({
    email: z.string().email('Invalid email format'),
  }),

  resetPasswordRequest: z.object({
    token: z.string().min(1, 'Reset token required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
};

/**
 * User Profile Schemas
 */
export const UserSchemas = {
  updateProfile: z.object({
    fullName: z.string().min(2, 'Full name required').optional(),
    username: z.string().min(3).max(30).optional(),
    bio: z.string().max(160).optional(),
    avatar: z.string().url().optional().or(z.literal('')),
    location: z.string().max(50).optional(),
    website: z.string().url().optional().or(z.literal('')),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
};

/**
 * Reel/Content Schemas
 */
export const ReelSchemas = {
  createReel: z.object({
    title: z.string().min(1, 'Title required').max(200),
    description: z.string().max(1000).optional(),
    video: z.object({
      uri: z.string().url(),
      mimeType: z.string(),
      size: z.number().positive(),
    }),
    thumbnail: z.string().url().optional(),
    categories: z.array(z.string()).min(1, 'At least one category required'),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']).default('PUBLIC'),
    allowComments: z.boolean().default(true),
    allowLikes: z.boolean().default(true),
    tags: z.array(z.string()).max(10).optional(),
  }),

  updateReel: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']).optional(),
    allowComments: z.boolean().optional(),
    allowLikes: z.boolean().optional(),
  }),

  reelComment: z.object({
    text: z.string().min(1, 'Comment cannot be empty').max(500),
    replyTo: z.string().optional(),
  }),
};

/**
 * Competition Schemas
 */
export const CompetitionSchemas = {
  participateRequest: z.object({
    competitionId: z.string().min(1),
    reelId: z.string().min(1),
  }),

  submitScore: z.object({
    score: z.number().min(0).max(100),
    reelId: z.string().min(1),
  }),
};

/**
 * Payment Schemas
 */
export const PaymentSchemas = {
  paymentMethod: z.object({
    type: z.enum(['CARD', 'UPI', 'WALLET', 'NET_BANKING']),
    cardNumber: z.string().regex(/^\d{13,19}$/, 'Invalid card number').optional(),
    expiryMonth: z.string().regex(/^\d{2}$/).optional(),
    expiryYear: z.string().regex(/^\d{2}$/).optional(),
    cvv: z.string().regex(/^\d{3,4}$/).optional(),
    upiId: z.string().email().optional(),
    holderName: z.string().min(2).optional(),
    isDefault: z.boolean().default(false),
  }),

  withdrawalRequest: z.object({
    amount: z.number().positive('Amount must be positive'),
    bankAccountId: z.string().min(1, 'Bank account required'),
    description: z.string().optional(),
  }),

  rechargeRequest: z.object({
    amount: z.number().positive('Amount must be positive'),
    paymentMethodId: z.string().min(1),
    promoCode: z.string().optional(),
  }),
};

/**
 * Search & Filter Schemas
 */
export const SearchSchemas = {
  searchQuery: z.object({
    query: z.string().min(1, 'Search query required').max(100),
    type: z.enum(['REEL', 'USER', 'COMPETITION', 'HASHTAG']).optional(),
    sort: z.enum(['RELEVANCE', 'LATEST', 'TRENDING']).default('RELEVANCE'),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20),
  }),

  categoryFilter: z.object({
    categories: z.array(z.string()).min(1),
    sortBy: z.enum(['TRENDING', 'LATEST', 'POPULAR']).default('TRENDING'),
    page: z.number().min(1).default(1),
  }),
};

/**
 * Notification Schemas
 */
export const NotificationSchemas = {
  notificationPreferences: z.object({
    likes: z.boolean().default(true),
    comments: z.boolean().default(true),
    follows: z.boolean().default(true),
    messages: z.boolean().default(true),
    competitions: z.boolean().default(true),
    promotions: z.boolean().default(false),
    sound: z.boolean().default(true),
    vibration: z.boolean().default(true),
  }),
};

/**
 * Generic Validation Helper
 */
export class ValidationService {
  /**
   * Validate data against schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): { valid: boolean; data?: T; errors?: Record<string, string> } {
    try {
      const validatedData = schema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);

        return { valid: false, errors };
      }

      return { valid: false, errors: { root: 'Validation failed' } };
    }
  }

  /**
   * Sanitize user input
   */
  static sanitize(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate email
   */
  static isValidEmail(email: string): boolean {
    const schema = z.string().email();
    const result = schema.safeParse(email);
    return result.success;
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    const schema = z.string().url();
    const result = schema.safeParse(url);
    return result.success;
  }

  /**
   * Validate phone number (basic international format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate file size
   */
  static isValidFileSize(sizeBytes: number, maxSizeMB: number = 100): boolean {
    return sizeBytes <= maxSizeMB * 1024 * 1024;
  }

  /**
   * Validate file type
   */
  static isValidFileType(mimeType: string, allowedTypes: string[]): boolean {
    if (allowedTypes.includes(mimeType)) return true;

    // Support wildcard types like 'image/*'
    for (const allowed of allowedTypes) {
      if (allowed.includes('*')) {
        const [type] = allowed.split('/');
        const [fileType] = mimeType.split('/');
        if (type === fileType || type === '*') return true;
      }
    }

    return false;
  }

  /**
   * Validate video file
   */
  static isValidVideoFile(mimeType: string, sizeBytes: number): boolean {
    const allowedVideoTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/quicktime',
    ];

    const maxVideoSize = 500 * 1024 * 1024; // 500MB

    return (
      this.isValidFileType(mimeType, allowedVideoTypes) &&
      this.isValidFileSize(sizeBytes, maxVideoSize / (1024 * 1024))
    );
  }

  /**
   * Validate image file
   */
  static isValidImageFile(mimeType: string, sizeBytes: number): boolean {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxImageSize = 50 * 1024 * 1024; // 50MB

    return (
      this.isValidFileType(mimeType, allowedImageTypes) &&
      this.isValidFileSize(sizeBytes, maxImageSize / (1024 * 1024))
    );
  }
}
