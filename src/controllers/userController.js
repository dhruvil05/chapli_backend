const User = require("../models/User");

const searchUser = async (req, res) => {
    const { searchTerm } = req.params;
    const regex = new RegExp(searchTerm, 'i');
    const users = await User.find({ username: regex });
    res.json({
        users
    });
}

module.exports = {
    searchUser
}


