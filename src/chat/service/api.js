export const API_URL = process.env.NODE_ENV === 'production'
  ? 'http://localhost:8000'  // render deployed backend address (prod)
  : 'http://localhost:8000';

export async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Upload failed');
    }

    return response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function getIncidents(skip = 0, limit = 10) {
  try {
    const response = await fetch(`${API_URL}/incidents?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch incidents error:', error);
    throw new Error('Failed to fetch incidents.');
  }
}

export async function createNewChat(title) {
  try {
    const response = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Create new chat error:', error);
    throw new Error('Failed to create new chat.');
  }
}

export async function deleteChat(chatId) {
  try {
    const response = await fetch(`${API_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Delete chat error:', error);
    throw new Error('Failed to delete chat.');
  }
}

export async function getAllChats() {
  try {
    const response = await fetch(`${API_URL}/chats`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch chats error:', error);
    throw new Error('Failed to fetch chats.');
  }
}

export async function getChatHistory(chatId) {
  try {
    const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch chat history error:', error);
    throw new Error('Failed to fetch chat history.');
  }
}

export async function askQuestion(chatId, message, onMessage, onError, onEnd) {
  try {
    const response = await fetch(`${API_URL}/chats/${chatId}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/event-stream')) {
      const payload = await response.json();
      if (payload?.answer) {
        onMessage && onMessage({ message: payload.answer, chat_id: payload.chat_id });
      }
      onEnd && onEnd();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        onEnd && onEnd();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            onEnd && onEnd();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            onMessage && onMessage(parsed);
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Chat context error:', error);
    onError && onError('Failed to fetch chat context.');
  }
}