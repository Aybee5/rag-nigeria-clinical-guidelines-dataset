import React, {
  useRef,
  useEffect,
  useReducer,
  useContext,
  createContext,
} from "react";
import action from "./action";
import reducer from "./reducer";
import { initState } from "./initState";
import { getAllChats, getChatHistory } from "../service/api";

export const ChatContext = createContext(null);
export const MessagesContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const isServerChatId = (id) => Number.isInteger(id) && id > 0 && id < 1_000_000_000;
  const init = JSON.parse(localStorage.getItem("SESSIONS")) || initState;
  const [state, dispatch] = useReducer(reducer, init);
  const actionList = action(state, dispatch);
  const latestState = useRef(state);
  const loadedChatIds = useRef(new Set());

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("SESSIONS"));
    if (savedState) {
      dispatch({ type: "SET_STATE", payload: savedState });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const normalizeChat = (chat) => ({
      id: chat.id,
      title: chat.title || "New Conversation",
      ct: chat.created_at || new Date().toISOString(),
      messages: [],
      icon: [2, "files"],
    });

    const loadChats = async () => {
      try {
        const chats = await getAllChats();

        if (cancelled || !Array.isArray(chats)) {
          return;
        }

        const normalizedChats = chats.map(normalizeChat);
        if (!normalizedChats.length) {
          return;
        }

        dispatch({
          type: "SET_STATE",
          payload: {
            chat: normalizedChats,
            currentChat: 0,
          },
        });
      } catch (error) {
        console.error("Failed to load chats from server:", error);
      }
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const currentChat = state.chat?.[state.currentChat];

    const loadCurrentChatHistory = async () => {
      if (!isServerChatId(currentChat?.id) || loadedChatIds.current.has(currentChat.id)) {
        return;
      }

      try {
        const history = await getChatHistory(currentChat.id);
        if (cancelled) {
          return;
        }

        const messages = Array.isArray(history?.messages)
          ? history.messages.map((message) => ({
            ...message,
            sentTime: message.created_at
              ? new Date(message.created_at).getTime()
              : message.sentTime || Date.now(),
          }))
          : [];

        loadedChatIds.current.add(currentChat.id);
        dispatch({
          type: "SET_STATE",
          payload: {
            chat: state.chat.map((chatItem, index) =>
              index === state.currentChat
                ? { ...chatItem, messages }
                : chatItem,
            ),
          },
        });
      } catch (error) {
        console.error("Failed to load chat history:", error);
        loadedChatIds.current.add(currentChat.id);
      }
    };

    loadCurrentChatHistory();

    return () => {
      cancelled = true;
    };
  }, [state.currentChat, state.chat]);

  useEffect(() => {
    const stateToSave = latestState.current;
    localStorage.setItem("SESSIONS", JSON.stringify(stateToSave));
  }, [latestState.current]);

  return (
    <ChatContext.Provider value={{ ...state, ...actionList }}>
      <MessagesContext.Provider value={dispatch}>
        {children}
      </MessagesContext.Provider>
    </ChatContext.Provider>
  );
};

export const useGlobal = () => useContext(ChatContext);
export const useMessages = () => useContext(MessagesContext);
