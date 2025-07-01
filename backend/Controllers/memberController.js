const Member = require("../models/Member");

exports.addMember = async (req, res) => {
  try {
    const { flatNumber, ownerName, coOwnerName, phoneNumber, email } = req.body;

    // Check if member already exists by flat number
    const existing = await Member.findOne({ flatNumber });
    if (existing) {
      return res.status(400).json({ message: "Member already exists." });
    }

    const newMember = new Member({
      flatNumber,
      ownerName,
      coOwnerName,
      phoneNumber,
      email,
    });

    await newMember.save();
    res.status(201).json({ message: "Member added successfully.", newMember });
  } catch (err) {
    console.error("Add Member Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
