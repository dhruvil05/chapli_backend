const logger = require('../utils/logger'); // Adjust the path as needed
const Message = require('../models/Message');

function getChatRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

function setupSocket(io) {
    io.on("connection", (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        socket.on('join-private-room', ({ roomId }) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined private room: ${roomId}`);
        });

        socket.on("sendMessage", async ({ senderId, receiverId, message, isGroup = false }) => {
            logger.info(`Message received from ${socket.id}: ${JSON.stringify(senderId)}: ${message}`);

            const roomId = isGroup
                ? receiverId
                : getChatRoomId(senderId, receiverId);

            const newMessage = new Message({
                roomId,
                senderId,
                receiverId: isGroup ? null : receiverId,
                message,
                isGroup
            });

            await newMessage.save();

            io.to(roomId).emit('receiveMessage', {
                senderId,
                receiverId,
                message,
                sentAt: newMessage.sentAt,
                isGroup
            });
        });

        socket.on('added-to-group', async ({ roomId }) => {
            socket.join(roomId);
            console.log(`User added to group ${roomId}`);
            io.emit('group-updated', { roomId });
        })

        socket.on('leave-group', ({ groupId, userId }) => {
            socket.leave(groupId);
            console.log('groupID: ', groupId);

            io.emit('group-updated', { groupId });
            console.log(`User ${userId} left group ${groupId}`);
        });

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