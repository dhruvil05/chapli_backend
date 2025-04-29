const Message = require("../models/Message");
const User = require("../models/User");
const Group = require("../models/Group");


function getChatRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

const storeMessage = async ({ senderId, receiverId, message, isGroup }) => {
    const roomId = isGroup
        ? receiverId // groupId
        : [senderId, receiverId].sort().join('_');

    const newMsg = new Message({ senderId, receiverId: isGroup ? null : receiverId, message, isGroup, roomId });
    return await newMsg.save();
};

const getAllMessages = async (roomId) => {
    return await Message.find({ roomId });
}

const getMessages = async (req, res) => {
    try {
        const { type } = req.body;

        if (type === 'private') {
            const { senderId, receiverId } = req.body;

            if (!senderId || !receiverId) {
                return res.status(400).json({ error: 'user1 and user2 are required' });
            }

            const messages = await Message.find({
                isGroup: false,
                $or: [
                    { senderId: senderId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }).sort({ createdAt: 1 });

            return res.json(messages);
        }

        if (type === 'group') {
            const { groupId } = req.body;

            if (!groupId) {
                return res.status(400).json({ error: 'groupId is required' });
            }

            const messages = await Message.find({
                isGroup: true,
                roomId: groupId
            }).sort({ createdAt: 1 });

            return res.json(messages);
        }

        return res.status(400).json({ error: 'Invalid type specified' });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const getChatList = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Exclude the logged-in user from the user list
        const users = await User.find({ _id: { $ne: userId } })
            .select('_id username email')
            .lean();

        const userChats = await Promise.all(
            users.map(async (user) => {
                const roomId = getChatRoomId(userId.toString(), user._id.toString());
                console.log(roomId);

                const lastMessageDoc = await Message.findOne({ roomId })
                    .sort({ sentAt: -1 }) // Latest first
                    .select('message sentAt');

                return {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    isGroup: false,
                    lastMessage: lastMessageDoc ? lastMessageDoc.message : null,
                    lastMessageTime: lastMessageDoc ? lastMessageDoc.sentAt : null
                };
            })
        );

        // Groups where user is a member
        const groups = await Group.find({ members: userId })
            .select('_id name admins')
            .lean();

        const groupChats = await Promise.all(
            groups.map(async (group) => {
                const roomId = group._id;
                // console.log(roomId);

                const lastMessageDoc = await Message.findOne({ roomId })
                    .sort({ sentAt: -1 }) // Latest first
                    .select('message sentAt');

                return {
                    _id: group._id,
                    groupName: group.name,
                    admins: group.admins,
                    isGroup: true,
                    lastMessage: lastMessageDoc ? lastMessageDoc.message : null,
                    lastMessageTime: lastMessageDoc ? lastMessageDoc.sentAt : null
                };
            })

        );

        const chatList = [...groupChats, ...userChats];

        res.json(chatList);
    } catch (error) {
        console.error("Failed to fetch chat list", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    storeMessage,
    getAllMessages,
    getMessages,
    getChatList
}