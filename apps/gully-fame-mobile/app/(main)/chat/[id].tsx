import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Alert,
  Animated,
  Clipboard,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { ChatMessageAPIData, chatService } from "@api/services/chatService";
import { socketChatService } from "@api/services/socketChatService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackIcon, MicIcon, SendIcon } from "@/icons";
import { chatScreenStyles as styles } from "@/styles/chatScreenStyles";
import Message from "@/components/ChatMessage/ChatMessage";

const getDimensions = () => Dimensions.get("window");
const SCREEN_WIDTH = Dimensions.get("window").width;
const allChatsForForward = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: require("@assets/images/user1.png"),
    isOnline: true,
  },
  {
    id: 2,
    name: "Mike Chen",
    avatar: require("@assets/images/user2.png"),
    isOnline: false,
  },
  {
    id: 3,
    name: "Emma Davis",
    avatar: require("@assets/images/user1.png"),
    isOnline: true,
  },
];

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "🔥"];
export default function ChatDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const chatUserId = id as string;
  const [dimensions, setDimensions] = useState(getDimensions());
  const [message, setMessage] = useState("");
  const [androidKeyboardSpacer, setAndroidKeyboardSpacer] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showForwardScreen, setShowForwardScreen] = useState(false);
  const [forwardingMessages, setForwardingMessages] = useState<any[]>([]);
  const [selectedForwardChats, setSelectedForwardChats] = useState<number[]>(
    [],
  );
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [messageReactions, setMessageReactions] = useState<{
    [key: string]: string[];
  }>({});
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const actionBarPosition = useRef<Animated.ValueXY>(
    new Animated.ValueXY({ x: 0, y: 0 }),
  ).current;
  const actionBarOpacity = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessageAPIData[]>([]);
  const [chatUserName, setChatUserName] = useState(name || "User");
  const [chatUserAvatar, setChatUserAvatar] = useState(
    require("@assets/images/user1.png"),
  );
  const [isOnline, setIsOnline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "ios") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setAndroidKeyboardSpacer(e.endCoordinates.height + 10);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setAndroidKeyboardSpacer(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        setCurrentUserId(userId);

        
        if (chatUserId && chatUserId !== "new") {
          try {
            
            
            if (name) {
              setChatUserName(name);
            }
            
          } catch (error) {
            console.error("Error fetching chat user profile:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching current user ID:", error);
      }
    };
    fetchUserData();
  }, [chatUserId, name]);

  
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!chatUserId || chatUserId === "new") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(
          "[ChatDetailScreen] Fetching chat details for:",
          chatUserId,
        );

        const response = await chatService.getChatDetails(chatUserId, 1, 50);

        if (response.success && response.data) {
          setMessages(response.data.messages);
          console.log("Set messages correctly", response.data.messages);
        } else {
          console.error(
            "[ChatDetailScreen] Failed to fetch chat:",
            response.message,
          );
          
          Alert.alert(
            "Error Loading Chat",
            response.message || "Failed to load conversation. Please try again.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          setMessages([]);
        }
      } catch (error: any) {
        console.error("[ChatDetailScreen] Error fetching chat:", error);
        Alert.alert(
          "Error",
          "Failed to load chat. Please try again.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchChatDetails();
    }
  }, [chatUserId, currentUserId]);

  
  useEffect(() => {
    const connectSocket = async () => {
      if (!chatUserId || chatUserId === "new" || !currentUserId) return;

      try {
        console.log("[ChatDetailScreen] Connecting socket...");
        await socketChatService.connect(chatUserId, {
          onMessageReceived: (newMessage: ChatMessageAPIData) => {
            console.log("[ChatDetailScreen] Real-time message received:", newMessage._id);
            setMessages((prev) => {
              
              if (prev.find((m) => m._id === newMessage._id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          },
          onMessageDelivered: (messageId: string) => {
            console.log("[ChatDetailScreen] Message delivered:", messageId);
            
          },
          onMessageDeleted: (messageId: string) => {
            console.log("[ChatDetailScreen] Message deleted:", messageId);
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
          },
          onConnected: () => {
            console.log("[ChatDetailScreen] Socket connected");
            setSocketConnected(true);
            setSocketError(null);
            
            socketChatService.markConversationRead(chatUserId);
          },
          onDisconnected: () => {
            console.log("[ChatDetailScreen] Socket disconnected");
            setSocketConnected(false);
          },
          onError: (error: string) => {
            console.error("[ChatDetailScreen] Socket error:", error);
            setSocketError(error);
          },
        });
      } catch (error: any) {
        console.error("[ChatDetailScreen] Socket connection failed:", error.message);
        setSocketError(error.message);
      }
    };

    connectSocket();

    
    return () => {
      console.log("[ChatDetailScreen] Disconnecting socket on unmount");
      socketChatService.disconnect();
    };
  }, [chatUserId, currentUserId]);

  // Auto-reconnect socket if disconnected when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (chatUserId && chatUserId !== "new" && currentUserId) {
        // Check if socket is disconnected and reconnect if needed
        if (!socketChatService.isConnected()) {
          console.log("[ChatDetailScreen] Socket disconnected on focus, reconnecting...");
          socketChatService.connect(chatUserId, {
            onMessageReceived: (newMessage: ChatMessageAPIData) => {
              console.log("[ChatDetailScreen] Real-time message received:", newMessage._id);
              setMessages((prev) => {
                if (prev.find((m) => m._id === newMessage._id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
            },
            onConnected: () => {
              console.log("[ChatDetailScreen] Socket reconnected");
              setSocketConnected(true);
              setSocketError(null);
              socketChatService.markConversationRead(chatUserId);
            },
            onDisconnected: () => {
              console.log("[ChatDetailScreen] Socket disconnected");
              setSocketConnected(false);
            },
            onError: (error: string) => {
              console.error("[ChatDetailScreen] Socket error:", error);
              setSocketError(error);
            },
          }).catch(err => console.error("[ChatDetailScreen] Reconnect error:", err));
        }
      }
    }, [chatUserId, currentUserId])
  );
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !chatUserId || chatUserId === "new" || sending) {
      return;
    }
    try {
      setSending(true);
      const messageText = message.trim();
      setMessage(""); 

      console.log("[ChatDetailScreen] Sending message to:", chatUserId);

      
      if (socketChatService.isConnected()) {
        console.log("[ChatDetailScreen] Sending via socket");
        const socketResult = await socketChatService.sendMessage(
          chatUserId,
          chatUserId,
          messageText
        );

        if (socketResult.success) {
          console.log("[ChatDetailScreen] Message sent via socket");
          
          return;
        } else {
          console.warn("[ChatDetailScreen] Socket send failed, falling back to REST");
        }
      }

      
      console.log("[ChatDetailScreen] Sending via REST API");
      const response = await chatService.sendChat(chatUserId, messageText);

      if (response.success) {
        
        if (!currentUserId) return;
        const newMessage: ChatMessageAPIData = {
          _id: Date.now().toString(), 
          message: messageText,
          receiver_id: chatUserId,
          sender_id: currentUserId,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMessage]);
      } else {
        if (!currentUserId) return;
        const newMessage: ChatMessageAPIData = {
          _id: Date.now().toString(), 
          message: messageText,
          receiver_id: chatUserId,
          sender_id: currentUserId,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]);
        console.warn("Couldn't send message to backend, updating UI");
        setMessage(messageText); 
      }
    } catch (error: any) {
      console.error("[ChatDetailScreen] Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
      setMessage(message.trim()); 
    } finally {
      setSending(false);
    }
  };

  const handleMicPress = () => {
    // Voice recording feature not implemented in managed Expo workflow
    // Would require native audio module (expo-av supports playback but not voice memo recording)
    // TODO: Implement voice message recording when available
    console.warn("[ChatDetailScreen] Voice recording not implemented");
  };

  
  const handleMessageLongPress = useCallback(
    (msg: any, event: any) => {
      if (isMultiSelectMode) return;

      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }

      setSelectedMessage(msg);

      
      if (event && event.nativeEvent) {
        const { pageY } = event.nativeEvent;
        actionBarPosition.setValue({ x: SCREEN_WIDTH / 2, y: pageY - 60 });
      }

      
      Animated.parallel([
        Animated.timing(actionBarOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [isMultiSelectMode, actionBarPosition, actionBarOpacity],
  );

  
  const handleMessagePress = useCallback(
    (msgId: string) => {
      if (isMultiSelectMode) {
        setSelectedMessages((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(msgId)) {
            newSet.delete(msgId);
          } else {
            newSet.add(msgId);
          }
          return newSet;
        });
      }
    },
    [isMultiSelectMode],
  );

  
  const hideActionBar = useCallback(() => {
    Animated.timing(actionBarOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedMessage(null);
    });
  }, [actionBarOpacity]);

  
  const handleCopyMessage = useCallback(() => {
    if (selectedMessage) {
      Clipboard.setString(selectedMessage.text);
      hideActionBar();
      
      Alert.alert("Copied", "Message copied to clipboard");
    }
  }, [selectedMessage, hideActionBar]);

  
  const handleForwardMessage = useCallback(() => {
    if (isMultiSelectMode && selectedMessages.size > 0) {
      
      const messagesToForward = messages.filter((m: any) =>
        selectedMessages.has(m._id),
      );
      setForwardingMessages(messagesToForward);
    } else if (selectedMessage) {
      
      setForwardingMessages([selectedMessage]);
    }
    hideActionBar();
    setShowForwardScreen(true);
    setIsMultiSelectMode(false);
    setSelectedMessages(new Set());
  }, [
    isMultiSelectMode,
    selectedMessages,
    selectedMessage,
    hideActionBar,
    messages,
  ]);

  
  const handleDeleteMessage = useCallback(() => {
    if (isMultiSelectMode && selectedMessages.size > 0) {
      Alert.alert(
        "Delete Messages",
        `Delete ${selectedMessages.size} message(s)?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                
                const deletePromises = Array.from(selectedMessages).map((msgId) =>
                  chatService.deleteMessage(msgId)
                );
                await Promise.all(deletePromises);

                setMessages((prev) =>
                  prev.filter((msg) => !selectedMessages.has(msg._id)),
                );

                setIsMultiSelectMode(false);
                setSelectedMessages(new Set());
                hideActionBar();
              } catch (error: any) {
                Alert.alert("Error", "Failed to delete messages");
              }
            },
          },
        ],
      );
    } else if (selectedMessage) {
      Alert.alert("Delete Message", "Delete this message?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              
              await chatService.deleteMessage(selectedMessage._id);
              setMessages((prev) =>
                prev.filter((msg) => msg._id !== selectedMessage._id),
              );
              hideActionBar();
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete message");
            }
          },
        },
      ]);
    }
  }, [isMultiSelectMode, selectedMessages, selectedMessage, hideActionBar]);

  
  const handleReactToMessage = useCallback(
    (emoji: string) => {
      if (selectedMessage) {
        setMessageReactions((prev) => {
          const msgId = selectedMessage._id;
          const currentReactions = prev[msgId] || [];
          if (currentReactions.includes(emoji)) {
            return {
              ...prev,
              [msgId]: currentReactions.filter((e) => e !== emoji),
            };
          } else {
            return { ...prev, [msgId]: [...currentReactions, emoji] };
          }
        });
        hideActionBar();
      }
    },
    [selectedMessage, hideActionBar],
  );

  
  const handleSelectMessage = useCallback(() => {
    if (selectedMessage) {
      setIsMultiSelectMode(true);
      setSelectedMessages(new Set([selectedMessage._id]));
      hideActionBar();
    }
  }, [selectedMessage, hideActionBar]);

  
  const handleSendForwardedMessages = useCallback(() => {
    if (selectedForwardChats.length === 0) {
      Alert.alert(
        "Select Chats",
        "Please select at least one chat to forward to",
      );
      return;
    }

    
    Alert.alert(
      "Forwarded",
      `Message forwarded to ${selectedForwardChats.length} chat(s)`,
    );
    setShowForwardScreen(false);
    setSelectedForwardChats([]);
    setForwardingMessages([]);
  }, [selectedForwardChats]);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 10) + 10, paddingBottom: 12 },
        ]}
      >
        {isMultiSelectMode ? (
          <>
            <TouchableOpacity
              onPress={() => {
                setIsMultiSelectMode(false);
                setSelectedMessages(new Set());
              }}
            >
              <Text style={styles.headerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedMessages.size} selected
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleDeleteMessage}
                style={styles.headerActionButton}
              >
                <Text style={styles.headerActionText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleForwardMessage}
                style={styles.headerActionButton}
              >
                <Text style={styles.headerActionText}>Forward</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <BackIcon />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Image source={chatUserAvatar} style={styles.headerAvatar} />
              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{chatUserName}</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.onlineDot,
                      { backgroundColor: isOnline ? "#4CAF50" : "#72777A" },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {isOnline ? "Always active" : "Offline"}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowMenu(true)}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="5" r="1.5" fill="#72777A" />
                <Circle cx="12" cy="12" r="1.5" fill="#72777A" />
                <Circle cx="12" cy="19" r="1.5" fill="#72777A" />
              </Svg>
            </TouchableOpacity>
          </>
        )}
      </View>

      {}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC9A15" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={hideActionBar}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No messages yet. Start the conversation!
                </Text>
              </View>
            ) : (
              messages.map((msg) => (
                <Message
                  key={msg._id}
                  chatUserAvatar={chatUserAvatar}
                  isHighlighted={
                    selectedMessage?._id === msg._id && !isMultiSelectMode
                  }
                  isMultiSelectMode={isMultiSelectMode}
                  isSelected={
                    isMultiSelectMode && selectedMessages.has(msg._id)
                  }
                  isSent={msg.sender_id === currentUserId}
                  message={msg}
                  onLongPress={handleMessageLongPress}
                  onPress={handleMessagePress}
                  reactions={messageReactions[msg._id] || []}
                ></Message>
              ))
            )}
          </ScrollView>
          {selectedMessage && !isMultiSelectMode && (
            <Animated.View
              style={[
                styles.actionBar,
                {
                  position: "absolute",
                  zIndex: 1000,
                  opacity: actionBarOpacity,
                  transform: [
                    {
                      translateX: actionBarPosition.x.interpolate({
                        inputRange: [0, SCREEN_WIDTH],
                        outputRange: [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
                      }),
                    },
                    { translateY: actionBarPosition.y },
                  ],
                },
              ]}
              pointerEvents="box-none"
            >
              <View style={styles.actionBarContent}>
                {}
                <TouchableOpacity
                  style={styles.actionBarButton}
                  onPress={handleCopyMessage}
                >
                  <Text style={styles.actionBarButtonText}>Copy</Text>
                </TouchableOpacity>
                {}
                <TouchableOpacity
                  style={styles.actionBarButton}
                  onPress={handleForwardMessage}
                >
                  <Text style={styles.actionBarButtonText}>Forward</Text>
                </TouchableOpacity>
                {}
                <TouchableOpacity
                  style={styles.actionBarButton}
                  onPress={handleDeleteMessage}
                >
                  <Text
                    style={[
                      styles.actionBarButtonText,
                      styles.actionBarButtonDanger,
                    ]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
                {/* React button - currently no emoji picker implementation */}
                <TouchableOpacity
                  style={styles.actionBarButton}
                  disabled={true}
                >
                  <Text style={[styles.actionBarButtonText, { opacity: 0.5 }]}>React</Text>
                </TouchableOpacity>
                {}
                <TouchableOpacity
                  style={styles.actionBarButton}
                  onPress={handleSelectMessage}
                >
                  <Text style={styles.actionBarButtonText}>Select</Text>
                </TouchableOpacity>
              </View>

              {}
              <View style={styles.reactionRow}>
                {REACTION_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionEmoji}
                    onPress={() => handleReactToMessage(emoji)}
                  >
                    <Text style={styles.reactionEmojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {}
          {selectedMessage && !isMultiSelectMode && (
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={hideActionBar}
            />
          )}
        </View>
      )}

      {}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#72777A"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.micButton} onPress={handleMicPress}>
            <MicIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <SendIcon />
          )}
        </TouchableOpacity>
      </View>
      {Platform.OS === "android" && (
        <View style={{ height: androidKeyboardSpacer }}></View>
      )}
      {}
      <Modal
        visible={showForwardScreen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowForwardScreen(false);
          setSelectedForwardChats([]);
        }}
      >
        <View style={styles.forwardScreenContainer}>
          <View
            style={[
              styles.forwardScreenHeader,
              { paddingTop: Math.max(insets.top, 10) + 10 },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setShowForwardScreen(false);
                setSelectedForwardChats([]);
              }}
            >
              <BackIcon color="#000" />
            </TouchableOpacity>
            <Text style={styles.forwardScreenTitle}>Forward to</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={allChatsForForward}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.forwardChatItem}
                onPress={() => {
                  setSelectedForwardChats((prev) => {
                    const newSet = [...prev];
                    const index = newSet.indexOf(item.id);
                    if (index > -1) {
                      newSet.splice(index, 1);
                    } else {
                      newSet.push(item.id);
                    }
                    return newSet;
                  });
                }}
              >
                <Image source={item.avatar} style={styles.forwardChatAvatar} />
                <Text style={styles.forwardChatName}>{item.name}</Text>
                {selectedForwardChats.includes(item.id) && (
                  <View style={styles.forwardChatCheck}>
                    <Text style={styles.forwardChatCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            style={styles.forwardChatList}
          />

          {selectedForwardChats.length > 0 && (
            <View
              style={[
                styles.forwardBottomBar,
                { paddingBottom: Math.max(insets.bottom, 10) },
              ]}
            >
              <TouchableOpacity
                style={styles.forwardSendButton}
                onPress={handleSendForwardedMessages}
              >
                <Text style={styles.forwardSendButtonText}>
                  Send ({selectedForwardChats.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                Alert.alert("Delete Chat", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => router.back(),
                  },
                ]);
              }}
            >
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                Delete Chat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                Alert.alert("Report", "Report this chat?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Report", style: "destructive", onPress: () => {} },
                ]);
              }}
            >
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
