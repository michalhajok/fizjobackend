const { body, param, query } = require("express-validator");

const validateCreatePatient = [
  body("personalInfo.firstName")
    .notEmpty()
    .withMessage("Imię jest wymagane")
    .isLength({ min: 2, max: 50 })
    .withMessage("Imię musi mieć od 2 do 50 znaków"),

  body("personalInfo.lastName")
    .notEmpty()
    .withMessage("Nazwisko jest wymagane")
    .isLength({ min: 2, max: 50 })
    .withMessage("Nazwisko musi mieć od 2 do 50 znaków"),

  body("personalInfo.pesel")
    .notEmpty()
    .withMessage("PESEL jest wymagany")
    .matches(/^\d{11}$/)
    .withMessage("PESEL musi składać się z 11 cyfr")
    .custom((value) => {
      // Walidacja checksum PESEL
      const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
      let sum = 0;

      for (let i = 0; i < 10; i++) {
        sum += parseInt(value[i]) * weights[i];
      }

      const checksum = (10 - (sum % 10)) % 10;

      if (checksum !== parseInt(value[10])) {
        throw new Error("Nieprawidłowy numer PESEL");
      }

      return true;
    }),

  body("personalInfo.contact.phone")
    .notEmpty()
    .withMessage("Numer telefonu jest wymagany")
    .matches(/^(\+48|0048|48)?[1-9]\d{8}$/)
    .withMessage("Nieprawidłowy polski numer telefonu"),

  body("personalInfo.contact.email")
    .notEmpty()
    .withMessage("Email jest wymagany")
    .isEmail()
    .withMessage("Nieprawidłowy adres email"),

  body("consentGiven")
    .notEmpty()
    .isBoolean()
    .custom((value) => {
      if (value !== true) {
        throw new Error("Zgoda na przetwarzanie danych jest wymagana");
      }
      return true;
    }),
];

module.exports = { validateCreatePatient };
