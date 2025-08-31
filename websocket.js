import { Server } from "socket.io";
import jwt from "jsonwebtoken";

class WebSocketServer {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map to store user connections
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log("🔌 WebSocket server initialized");
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use((socket, next) => {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace("Bearer ", "");
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userData = decoded;

        next();
      } catch (error) {
        console.error("WebSocket authentication error:", error);
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`🔗 User connected: ${socket.userId} (${socket.userRole})`);

      // Store user connection
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        role: socket.userRole,
        connectedAt: new Date(),
      });

      // Join user to their role-specific room
      socket.join(socket.userRole.toLowerCase());

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle custom events
      socket.on("join_case_room", (caseId) => {
        socket.join(`case_${caseId}`);
        console.log(`📁 User ${socket.userId} joined case room: ${caseId}`);
      });

      socket.on("leave_case_room", (caseId) => {
        socket.leave(`case_${caseId}`);
        console.log(`📁 User ${socket.userId} left case room: ${caseId}`);
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      this.io.to(`user_${userId}`).emit("notification", notification);
      console.log(
        `📨 Notification sent to user ${userId}:`,
        notification.title
      );
    } else {
      console.log(`⚠️ User ${userId} not connected, notification queued`);
      // In a production system, you might want to queue notifications for offline users
    }
  }

  // Send notification to all users of a specific role
  sendToRole(role, notification) {
    this.io.to(role.toLowerCase()).emit("notification", notification);
    console.log(`📨 Notification sent to all ${role}s:`, notification.title);
  }

  // Send notification to all users in a case
  sendToCase(caseId, notification) {
    this.io.to(`case_${caseId}`).emit("case_notification", notification);
    console.log(
      `📨 Case notification sent for case ${caseId}:`,
      notification.title
    );
  }

  // Send notification to multiple specific users
  sendToUsers(userIds, notification) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, notification);
    });
  }

  // Broadcast system-wide notification
  broadcastToAll(notification) {
    this.io.emit("system_notification", notification);
    console.log(`📢 System notification broadcast:`, notification.title);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  getConnectedUsersByRole(role) {
    const users = [];
    this.connectedUsers.forEach((userData, userId) => {
      if (userData.role === role) {
        users.push({ userId, ...userData });
      }
    });
    return users;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

export default new WebSocketServer();
