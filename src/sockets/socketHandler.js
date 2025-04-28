const { joinGroup } = require('../controllers/groupController');
const logger = require('../utils/logger'); // Adjust the path as needed
const Message = require('../models/Message');

function getChatRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

function setupSocket(io) {
    // Socket.io connection handling
    io.on("connection", (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        // Join private chat room
        socket.on('join-private-room', ({ roomId }) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined private room: ${roomId}`);
        });

        socket.on('join-room', ({ roomId }) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined private room: ${roomId}`);
        });

        // Handle events from clients
        socket.on("sendMessage", async ({ senderId, receiverId, message, isGroup = false }) => {
            logger.info(`Message received from ${socket.id}: ${JSON.stringify(senderId)}: ${message}`);

            const roomId = isGroup
                ? receiverId // for groups, receiverId is groupId
                : getChatRoomId(senderId, receiverId);

            // Save message to DB
            const newMessage = new Message({
                roomId,
                senderId,
                receiverId: isGroup ? null : receiverId,
                message,
                isGroup
            });

            await newMessage.save();

            // Broadcast the message to all connected clients
            io.to(roomId).emit('receiveMessage', {
                senderId,
                receiverId,
                message,
                sentAt: newMessage.sentAt,
                isGroup
            });
        });

        // Example: Join a specific room
        socket.on('join-group', async ({ groupId, userId }) => {
            try {
                const res = await joinGroup(groupId, userId);
                if (!res.success) {
                    socket.emit('group-error', { message: res.message });
                    return;
                }
                socket.join(groupId);
                // socket.to(groupId).emit('user-joined-group', { userId, groupId });
                console.log(`User ${userId} joined group ${groupId}`);
            } catch (err) {
                console.error(err);
                socket.emit('group-error', { message: 'Failed to join group.' });
            }
        });

        socket.on('leave-group', ({ groupId, userId }) => {
            socket.leave(groupId);
            socket.to(groupId).emit('user-left-group', { userId, groupId });
            console.log(`User ${userId} left group ${groupId}`);
        });

        // Example: Send message to specific room
        // socket.on("room-message", ({ roomId, message }) => {
        //     logger.info(`Room message to ${roomId}: ${JSON.stringify(message)}`);
        //     io.to(roomId).emit("room-message", {
        //         sender: socket.id,
        //         message,
        //         timestamp: new Date()
        //     });
        // });

        // Example: Private message to specific client
        // socket.on("private-message", ({ to, message }) => {
        //     logger.info(`Private message to ${to}: ${JSON.stringify(message)}`);
        //     socket.to(to).emit("private-message", {
        //         sender: socket.id,
        //         message,
        //         timestamp: new Date()
        //     });
        // });

        // Handle disconnection
        socket.on("disconnect", () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });

        // Handle errors
        socket.on("error", (error) => {
            logger.error(`Socket error for ${socket.id}:`, error);
        });
    });
}

module.exports = { setupSocket };