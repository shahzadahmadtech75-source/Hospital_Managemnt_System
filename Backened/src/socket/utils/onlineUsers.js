// socket/utils/onlineUsers.js

class OnlineUsers {
  constructor() {
    this.users = new Map(); // userId -> Set of socket IDs
  }

  addUser(userId, socketId) {
    if (!this.users.has(userId)) {
      this.users.set(userId, new Set());
    }
    this.users.get(userId).add(socketId);
  }

  removeUser(userId, socketId) {
    const userSockets = this.users.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.users.delete(userId);
        return true; // User is now offline
      }
    }
    return false; // User still has other connections
  }

  isOnline(userId) {
    return this.users.has(userId);
  }

  getOnlineUsers() {
    return Array.from(this.users.keys());
  }
}

export default new OnlineUsers();