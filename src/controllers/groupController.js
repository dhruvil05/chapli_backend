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
    const group = new Group({ name, members, "admin":adminId });
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
  const groupId = req.params.id;
  const userId = req.body.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group.'
      });
    }
    group.members.push(userId);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const leaveGroup = async (req, res) => {
  const groupId = req.params.id;
  const userId = req.body.userId;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGroups,
  createGroup,
  deleteGroup,
  joinGroup,
  leaveGroup
};