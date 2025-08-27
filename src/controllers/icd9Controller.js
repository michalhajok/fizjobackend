const Icd9Procedure = require("../models/Icd");

exports.getIcd9Procedures = async (req, res) => {
  try {
    const search = (req.query.search ?? "").trim();
    const filter = search
      ? {
          $or: [
            { code: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const results = await Icd9Procedure.find(filter)
      // .limit(50)
      .sort({ code: 1 });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
