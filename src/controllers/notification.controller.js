const Notification = require("../models/Notification");

// Pobierz wszystkie powiadomienia użytkownika (lub wszystkich, jeśli admin)
exports.getNotifications = async (req, res) => {
  try {
    // Jeśli użytkownik nie jest adminem, pobiera tylko swoje powiadomienia
    const filter = req.user.role === "admin" ? {} : { recipient: req.user._id };

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Błąd pobierania powiadomień" });
  }
};

// Pobierz szczegóły powiadomienia
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Powiadomienie nie znalezione" });
    }
    // Sprawdź uprawnienia
    if (
      req.user.role !== "admin" &&
      notification.recipient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Brak dostępu" });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Błąd pobierania powiadomienia" });
  }
};

// Utwórz nowe powiadomienie
exports.createNotification = async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      createdBy: req.user._id,
    });
    await notification.save();
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Błąd tworzenia powiadomienia" });
  }
};

// Zaktualizuj powiadomienie
exports.updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Powiadomienie nie znalezione" });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Błąd aktualizacji powiadomienia" });
  }
};

// Usuń powiadomienie
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Powiadomienie nie znalezione" });
    }
    res.json({ success: true, message: "Powiadomienie usunięte" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Błąd usuwania powiadomienia" });
  }
};
