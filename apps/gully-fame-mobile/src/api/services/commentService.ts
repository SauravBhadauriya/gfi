import { apiDelete, apiGet, apiPost, toResult } from "../client";

/**
 * Reel comments.
 * POST   /reels/:reelId/comments { text, parentCommentId? }  (replies use parentCommentId)
 * GET    /reels/:reelId/comments?page&limit
 * DELETE /reels/comments/:commentId                          (own comments only)
 * There is no comment like/unlike endpoint.
 */

export interface CommentAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage: string;
}

export interface ReelComment {
  _id: string;
  reel: string;
  /** Populated when listing; a plain id right after creating. */
  author: CommentAuthor | string;
  text: string;
  parentComment: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsPage {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  comments: ReelComment[];
}

export const COMMENT_MAX_LENGTH = 1000;

export const listComments = (reelId: string, page = 1, limit = 20) =>
  apiGet<CommentsPage>(`reels/${reelId}/comments`, { params: { page, limit } });

export const addComment = (reelId: string, text: string, parentCommentId?: string | null) =>
  apiPost<ReelComment>(`reels/${reelId}/comments`, {
    text: text.trim(),
    ...(parentCommentId ? { parentCommentId } : {}),
  });

export const deleteComment = (commentId: string) => apiDelete(`reels/comments/${commentId}`);

export const commentAuthorName = (author: ReelComment["author"]): string => {
  if (!author || typeof author === "string") return "";
  const full = `${author.firstName || ""} ${author.lastName || ""}`.trim();
  return author.username || full || "User";
};

export const commentService = {
  listComments,
  addComment,
  deleteComment,
  getComments: (reelId: string, page = 1, limit = 20) => toResult(() => listComments(reelId, page, limit)),
};

export default commentService;
