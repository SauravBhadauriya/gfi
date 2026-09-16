// Created by Kiro - Comments Screen
// Displays all comments for a reel with add/delete/like functionality

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { commentService, Comment } from "../api/services/commentService";

interface CommentsScreenProps {
  route?: any;
  navigation?: any;
}

// ✅ CREATED BY KIRO - Comments Screen Component
export default function CommentsScreen({ route, navigation }: CommentsScreenProps) {
  const reelId = route?.params?.reelId || "";

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedComments, setLikedComments] = useState<{ [key: string]: boolean }>({});

  // ✅ CREATED BY KIRO - Load comments on mount
  useEffect(() => {
    loadComments();
  }, [reelId]);

  // ✅ CREATED BY KIRO - Load comments from API
  const loadComments = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const response = await commentService.getComments(reelId, {
        page: pageNum,
        limit: 10,
      });

      if (response.success && response.data) {
        if (pageNum === 1) {
          setComments(response.data.items);
        } else {
          setComments((prev) => [...prev, ...response.data!.items]);
        }

        setPage(pageNum);
        setHasMore(response.data.items.length === 10);

        console.log("[CommentsScreen] Comments loaded:", response.data.total);
      } else {
        Alert.alert("Error", response.message || "Failed to load comments");
      }
    } catch (error) {
      console.error("[CommentsScreen] Error loading comments:", error);
      Alert.alert("Error", "Failed to load comments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle refresh
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadComments(1);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadComments(page + 1);
    }
  };

  // ✅ CREATED BY KIRO - Handle add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setSubmitting(true);

      const response = await commentService.addComment(reelId, {
        text: commentText,
      });

      if (response.success && response.data) {
        const newComment: Comment = {
          _id: response.data._id,
          reelId: response.data.reelId,
          userId: response.data.userId,
          userName: response.data.userName,
          userAvatar: response.data.userAvatar,
          text: response.data.text,
          likeCount: response.data.likeCount,
          createdAt: response.data.createdAt,
        };

        setComments([newComment, ...comments]);
        setCommentText("");
        console.log("[CommentsScreen] Comment added successfully");
      } else {
        Alert.alert("Error", response.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("[CommentsScreen] Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ CREATED BY KIRO - Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await commentService.deleteComment(commentId);

            if (response.success) {
              setComments((prev) => prev.filter((c) => c._id !== commentId));
              console.log("[CommentsScreen] Comment deleted successfully");
            } else {
              Alert.alert("Error", response.message || "Failed to delete comment");
            }
          } catch (error) {
            console.error("[CommentsScreen] Error deleting comment:", error);
            Alert.alert("Error", "Failed to delete comment");
          }
        },
      },
    ]);
  };

  // ✅ CREATED BY KIRO - Handle like comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const isLiked = likedComments[commentId];

      if (isLiked) {
        const response = await commentService.unlikeComment(commentId);

        if (response.success) {
          setLikedComments((prev) => ({
            ...prev,
            [commentId]: false,
          }));

          setComments((prev) =>
            prev.map((c) => (c._id === commentId ? { ...c, likeCount: (c.likeCount || 0) - 1 } : c))
          );

          console.log("[CommentsScreen] Comment unliked");
        }
      } else {
        const response = await commentService.likeComment(commentId);

        if (response.success) {
          setLikedComments((prev) => ({
            ...prev,
            [commentId]: true,
          }));

          setComments((prev) =>
            prev.map((c) => (c._id === commentId ? { ...c, likeCount: (c.likeCount || 0) + 1 } : c))
          );

          console.log("[CommentsScreen] Comment liked");
        }
      }
    } catch (error) {
      console.error("[CommentsScreen] Error liking comment:", error);
    }
  };

  // ✅ CREATED BY KIRO - Render comment item
  const renderCommentItem = (comment: Comment) => {
    // Safety check for comment and _id
    if (!comment || !comment._id) {
      return null;
    }

    return (
      <View key={comment._id} style={styles.commentItem}>
        {/* User Avatar */}
        {comment.userAvatar ? (
          <Image source={{ uri: comment.userAvatar }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>👤</Text>
          </View>
        )}

        {/* Comment Content */}
        <View style={styles.commentContent}>
          {/* Header */}
          <View style={styles.commentHeader}>
            <Text style={styles.userName}>{comment.userName}</Text>
            <Text style={styles.timestamp}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
          </View>

          {/* Comment Text */}
          <Text style={styles.commentText}>{comment.text}</Text>

          {/* Actions */}
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikeComment(comment._id)}
            >
              <Text style={styles.actionIcon}>{likedComments[comment._id] ? "❤️" : "🤍"}</Text>
              <Text style={styles.actionText}>{comment.likeCount || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteComment(comment._id)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ✅ CREATED BY KIRO - Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>No Comments Yet</Text>
      <Text style={styles.emptyText}>Be the first to comment!</Text>
    </View>
  );

  // ✅ CREATED BY KIRO - Render loading state
  if (loading && comments.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Comments ({comments.length})</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Comments List */}
      {comments.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={comments}
          renderItem={({ item }) => renderCommentItem(item)}
          keyExtractor={(item, index) => item?._id || `comment-${index}`}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && comments.length > 0 ? (
              <ActivityIndicator size="small" color="#007AFF" style={styles.footer} />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        {/* ✅ UPDATED BY KIRO - OLD CODE (COMMENTED) - Input was disabled during submission
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!submitting}
        />
        */}

        {/* ✅ UPDATED BY KIRO - NEW CODE - Input always enabled like Instagram, user can type multiple comments */}
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={true}
        />
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleAddComment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  placeholder: {
    width: 50,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarPlaceholderText: {
    fontSize: 20,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    paddingVertical: 16,
  },
});
