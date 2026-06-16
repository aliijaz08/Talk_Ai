// Empty string = same origin (useful if you add a proxy). Default talks to the API server directly.
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function jsonOrThrow(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const msg =
            typeof data.error === 'string'
                ? data.error
                : data.message || response.statusText || `Request failed (${response.status})`;
        throw new Error(msg);
    }
    return data;
}

export const api = {
    async signup(username, email, password) {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        return response.json();
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        return { ok: response.ok, data };
    },

    async getChats(token) {
        const response = await fetch(`${API_BASE_URL}/api/chats`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return jsonOrThrow(response);
    },

    async createChat(token, title) {
        const response = await fetch(`${API_BASE_URL}/api/chats`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });
        return jsonOrThrow(response);
    },

    async getChat(token, chatId) {
        const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return jsonOrThrow(response);
    },

    async updateChat(token, chatId, title) {
        const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });
        return jsonOrThrow(response);
    },

    async togglePin(token, chatId) {
        const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/pin`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return jsonOrThrow(response);
    },

    async deleteChat(token, chatId) {
        const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return jsonOrThrow(response);
    },

    async uploadProfilePicture(token, file) {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch(`${API_BASE_URL}/api/user/profile/picture`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });
        return jsonOrThrow(response);
    },

    getProfilePictureUrl(path) {
        return path ? `${API_BASE_URL}${path}` : null;
    }
};

export const API_BASE_URL_EXPORT = API_BASE_URL;
