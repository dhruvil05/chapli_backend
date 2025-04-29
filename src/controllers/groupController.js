const Group = require('../models/Group');

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGroup = async (req, res) => {
  const { name, members, adminId } = req.body;

  try {
    members.push(adminId);
    const group = new Group({ name, members, "admins": [adminId] });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  const groupId = req.params.id;

  try {
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinGroup = async (req, res) => {

  const { groupId, userIds } = req.body;

  if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid groupId or userIds' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Avoid duplicates
    const newUsers = userIds.filter((id) => !group.members.includes(id));
    group.members.push(...newUsers);
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Users added to group',
      addedUsers: newUsers
    });

    // res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveGroup = async (req, res) => {
  const { groupId, userIds, requestingUserId } = req.body;


  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (group.admins.toString() !== requestingUserId) {
      return res.status(403).json({ success: false, message: 'Only group admin can remove users' });
    }

    // Prevent removing all admins unless fallback handled
    const willRemoveAllAdmins = group.admins.every((adminId) =>
      userIds.includes(adminId.toString())
    );

    if (willRemoveAllAdmins && group.members.length - userIds.length > 0) {
      // Promote a new admin before removing
      const newAdmin = group.members.find(
        (memberId) => !group.admins.includes(memberId) && !userIds.includes(memberId.toString())
      );

      if (newAdmin) {
        group.admins = [newAdmin]; // Replace with one new admin
      } else {
        return res.status(400).json({ message: 'No member left to promote as admin' });
      }
    } else {
      // Just remove admins being removed
      group.admins = group.admins.filter(
        (adminId) => !userIds.includes(adminId.toString())
      );
    }

    group.members = group.members.filter(memberId => !userIds.includes(memberId.toString()));
    await group.save();

    res.status(200).json({ success: true, message: 'Users removed', removedUserIds: userIds });
    // res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGroups,
  createGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
};