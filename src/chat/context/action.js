import { createNewChat, askQuestion, deleteChat } from "../service/api";

export default function action(state, dispatch) {
  const setState = (payload = {}) =>
    dispatch({
      type: "SET_STATE",
      payload: { ...payload },
    });

  const ensureValidChatState = () => {
    if (!state.chat || !Array.isArray(state.chat) || state.chat.length === 0) {
      setState({
        chat: [{
          title: "Welcome",
          id: Date.now(),
          ct: new Date().toISOString(),
          messages: [],
          icon: [2, "files"],
        }],
        currentChat: 0
      });
      return false;
    }

    if (state.currentChat >= state.chat.length) {
      setState({ currentChat: state.chat.length - 1 });
      return false;
    }

    return true;
  };

  const toLocalChat = (chatData = {}) => ({
    id: chatData.id ?? Date.now(),
    title: chatData.title || "New Conversation",
    ct: chatData.created_at || new Date().toISOString(),
    messages: [],
    icon: [2, "files"],
  });

  return {
    setState,
    clearTypeing() {
      setState({
        typeingMessage: { content: '' },
        is: { ...state.is, typeing: false }
      });
    },
    async sendMessage() {

      if (!ensureValidChatState()) return;

      const { typeingMessage, chat, is, currentChat } = state;
      if (!typeingMessage?.content) return;

      try {
        // Store the original message in chat history
        const messages = [...(chat[currentChat].messages || []), {
          ...typeingMessage,
          sentTime: Date.now()
        }];

        let newChat = [...chat];
        newChat[currentChat] = { ...chat[currentChat], messages };

        // Set thinking state immediately
        setState({
          is: { ...is, thinking: true },
          typeingMessage: { content: '' },
          chat: newChat,
        });

        let answer = '';
        const currentChatState = newChat[currentChat] || chat[currentChat];
        let activeChat = currentChatState;

        if (!activeChat?.id || !Number.isInteger(activeChat.id)) {
          const createdChat = await createNewChat(activeChat?.title || "New Conversation");
          activeChat = {
            ...currentChatState,
            id: createdChat.id,
            title: createdChat.title || currentChatState.title,
            ct: createdChat.created_at || currentChatState.ct,
          };
          newChat[currentChat] = activeChat;
          setState({ chat: newChat });
        }

        // Ask the backend for the selected chat id.
        await askQuestion(
          activeChat.id,
          typeingMessage.content,
          (data) => {
            if (data.content || data.message || data.answer) {
              answer += data.content || data.message || data.answer || "";
              if (!newChat[currentChat]) return;
              newChat[currentChat] = {
                ...newChat[currentChat],
                messages: [
                  ...messages,
                  {
                    content: answer,
                    role: "assistant",
                    sentTime: Date.now(),
                    id: Date.now(),
                  },
                ],
              };
              setState({
                is: { ...is, thinking: answer.length || false },
                chat: newChat,
              });
            }
          },
          (error) => {
            console.error('Stream error:', error);
            if (newChat[currentChat]) {
              newChat[currentChat] = {
                ...chat[currentChat],
                error,
              };
              setState({
                chat: newChat,
                is: { ...is, thinking: false },
              });
            }
          },
          () => {
            setState({
              is: { ...is, thinking: false },
            });
          }
        );
      } catch (error) {
        console.error('Error sending message:', error);
        setState({
          is: { ...is, thinking: false },
        });
      }
    },

    async newChat() {
      const { chat } = state;
      try {
        const createdChat = await createNewChat("New Conversation");
        const chatList = [...chat, toLocalChat(createdChat)];
        setState({ chat: chatList, currentChat: chatList.length - 1 });
      } catch (error) {
        console.error('Create chat error:', error);
      }
    },

    modifyChat(arg, index) {
      if (!ensureValidChatState()) return;
      const chat = [...state.chat];
      chat[index] = { ...chat[index], ...arg };
      setState({ chat, currentEditor: null });
    },

    editChat(index, title) {
      if (!ensureValidChatState()) return;
      const chat = [...state.chat];
      chat[index] = { ...chat[index], title };
      setState({ chat });
    },

    async removeChat(index) {
      if (!ensureValidChatState()) return;
      const chat = [...state.chat];
      const chatToRemove = chat[index];

      if (chatToRemove?.id && Number.isInteger(chatToRemove.id)) {
        try {
          await deleteChat(chatToRemove.id);
        } catch (error) {
          console.error('Failed to delete chat from server:', error);
        }
      }

      chat.splice(index, 1);

      if (chat.length === 0) {
        chat.push({
          title: "New Conversation",
          id: Date.now(),
          messages: [],
          ct: new Date().toISOString(),
          icon: [2, "files"],
        });
      }

      setState({
        chat,
        currentChat: state.currentChat === index ? Math.max(0, index - 1) : state.currentChat
      });
    },

    setMessage(content) {
      const typeingMessage = content === "" ? { content: '' } : {
        role: "user",
        content,
        id: Date.now(),
      };
      setState({
        is: { ...state.is, typeing: content !== '' },
        typeingMessage
      });
    },

    clearMessage() {
      if (!ensureValidChatState()) return;
      const chat = [...state.chat];
      chat[state.currentChat] = { ...chat[state.currentChat], messages: [] };
      setState({ chat });
    },

    removeMessage(index) {
      if (!ensureValidChatState()) return;
      const chat = [...state.chat];
      const messages = [...chat[state.currentChat].messages];
      messages.splice(index, 1);
      chat[state.currentChat] = { ...chat[state.currentChat], messages };
      setState({ chat });
    },

    setOptions({ type, data = {} }) {
      const options = {
        ...state.options,
        [type]: { ...state.options[type], ...data }
      };
      setState({ options });
    },

    setIs(arg) {
      setState({ is: { ...state.is, ...arg } });
    },

    currentList() {
      return ensureValidChatState() ? state.chat[state.currentChat] : null;
    },

    stopResonse() {
      setState({
        is: { ...state.is, thinking: false },
      });
    },
  };
}