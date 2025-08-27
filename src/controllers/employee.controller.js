const Employee = require("../models/Employee");

exports.getEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.json({ success: true, data: employees });
};

exports.getEmployeesType = async (req, res) => {
  const { role } = req.params;
  console.log(role);

  const employees = await Employee.find({ "professionalInfo.position": role });
  res.json({ success: true, data: employees });
};

exports.getEmployeeById = async (req, res) => {
  const employee = await Employee.find({ user: req.params.id });
  if (!employee)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono pracownika" });
  res.json({ success: true, data: employee[0] });
};

exports.createEmployee = async (req, res) => {
  const employee = new Employee(req.body);
  await employee.save();
  res.status(201).json({ success: true, data: employee });
};

exports.updateEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!employee)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono pracownika" });
  res.json({ success: true, data: employee });
};

exports.deleteEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono pracownika" });
  res.json({ success: true, message: "Pracownik usunięty" });
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Nieprawidłowy status" });
    }
    const emp = await Employee.findByIdAndUpdate(id, { status }, { new: true });
    if (!emp) return res.status(404).json({ error: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

/**
+ * Resetowanie hasła pracownika – generuje i wysyła nowe hasło
+ */

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: logic to generate new password and send email
    await Employee.findByIdAndUpdate(id, {
      /* hashed new password */
    });
    res.json({ message: "Password reset link sent" });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

/**
+ * Obciążenie pracownika – liczy liczbę wizyt w okresie
+ */
exports.getWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    if (!start || !end)
      return res.status(400).json({ error: "start i end wymagane" });
    // importer modelu Visit, liczenie
    const Visit = require("../models/Visit");
    const count = 0;
    //await Visit.countDocuments({
    //employee: id,
    //date: { $gte: new Date(start), $lte: new Date(end) },
    //});
    res.json({ employee: id, workload: count });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date wymagane" });
    // TODO: analogicznie do getAvailableSlots w appointment.controller
    res.json({ employee: id, date, slots: [] });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

exports.updateEmployeeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;

    // Walidacja harmonogramu
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      return res.status(400).json({
        success: false,
        message: "Harmonogram musi zawierać 7 dni tygodnia",
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { schedule },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Nie znaleziono pracownika",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getEmployeeSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id).select(
      "personalInfo schedule"
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Nie znaleziono pracownika",
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
