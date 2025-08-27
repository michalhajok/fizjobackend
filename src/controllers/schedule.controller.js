const Schedule = require("../models/Schedule");

exports.getSchedules = async (req, res) => {
  const schedules = await Schedule.find();
  res.json({ success: true, data: schedules });
};

exports.getScheduleById = async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono harmonogramu" });
  res.json({ success: true, data: schedule });
};

exports.createSchedule = async (req, res) => {
  const schedule = new Schedule(req.body);
  await schedule.save();
  res.status(201).json({ success: true, data: schedule });
};

exports.updateSchedule = async (req, res) => {
  const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!schedule)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono harmonogramu" });
  res.json({ success: true, data: schedule });
};

exports.deleteSchedule = async (req, res) => {
  const schedule = await Schedule.findByIdAndDelete(req.params.id);
  if (!schedule)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono harmonogramu" });
  res.json({ success: true, message: "Harmonogram usunięty" });
};
