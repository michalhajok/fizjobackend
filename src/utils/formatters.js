// // Formatowanie danych pacjenta do różnych widoków
// const formatPatientData = (patient, format = 'standard') => {
//   switch (format) {
//     case 'basic':
//       // Podstawowe dane
//       return {
//         id: patient._id,
//         firstName: patient.personalInfo.firstName,
//         lastName: patient.personalInfo.lastName,
//         pesel: patient.personalInfo.pesel
//       };

//     case 'list':
//       // Format do listy pacjentów
//       return {
//         id: patient._id,
//         firstName: patient.personalInfo.firstName,
//         lastName: patient.personalInfo.lastName,
//         dateOfBirth: patient.personalInfo.dateOfBirth,
//         phone: patient.personalInfo.contact.phone,
//         email: patient.personalInfo.contact.email,
//         createdAt: patient.createdAt,
//         isActive: patient.isActive
//       };

//     case 'print':
//       // Format do wydruku
//       return {
//         personalInfo: patient.personalInfo,
//         createdAt: patient.createdAt,
//         lastVisit: patient.visits && patient.visits.length > 0
//           ? patient.visits[patient.visits.length - 1]
//           : null
//       };

//     case 'standard':
//     default:
//       // Standardowy format (pełny ale bez wrażliwych danych)
//       const formattedPatient = { ...patient };
//       // Ukryj wrażliwe dane
//       if (formattedPatient.personalInfo) {
//         delete formattedPatient.personalInfo.pesel;
//       }
//       return formattedPatient;
//   }
// };

// // Formatowanie dat
// const formatDate = (date, format = 'default', locale = 'pl-PL') => {
//   if (!date) return null;

//   const d = new Date(date);

//   switch (format) {
//     case 'short':
//       return d.toLocaleDateString(locale);

//     case 'time':
//       return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

//     case 'datetime':
//       return d.toLocaleString(locale);

//     case 'iso':
//       return d.toISOString();

//     case 'human':
//       const now = new Date();
//       const diff = now - d;

//       // Jeśli mniej niż 24h
//       if (diff < 86400000) {
//         if (diff < 3600000) {
//           const mins = Math.floor(diff / 60000);
//           return `${mins} ${mins === 1 ? 'minutę' : mins < 5 ? 'minuty' : 'minut'} temu`;
//         } else {
//           const hours = Math.floor(diff / 3600000);
//           return `${hours} ${hours === 1 ? 'godzinę' : hours < 5 ? 'godziny' : 'godzin'} temu`;
//         }
//       }

//       // Dziś, wczoraj, itd.
//       if (d.toDateString() === now.toDateString()) {
//         return `Dziś, ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
//       }

//       now.setDate(now.getDate() - 1);
//       if (d.toDateString() === now.toDateString()) {
//         return `Wczoraj, ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
//       }

//       return d.toLocaleDateString(locale);

//     case 'default':
//     default:
//       return d.toLocaleDateString(locale, {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       });
//   }
// };

// // Formatowanie czasów (h:mm)
// const formatTime = (timeString) => {
//   if (!timeString) return null;

//   // Jeśli przyszedł format HH:MM
//   if (timeString.match(/^\d{1,2}:\d{2}$/)) {
//     return timeString;
//   }

//   // Jeśli przyszedł obiekt Date
//   if (timeString instanceof Date) {
//     return timeString.toLocaleTimeString('pl-PL', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: false
//     });
//   }

//   // Jeśli przyszła liczba minut od północy
//   if (typeof timeString === 'number') {
//     const hours = Math.floor(timeString / 60);
//     const minutes = timeString % 60;

//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
//   }

//   return timeString;
// };

// // Formatowanie danych do eksportu
// const formatForExport = (data, format = 'csv') => {
//   if (!data || !Array.isArray(data)) {
//     return null;
//   }

//   switch (format) {
//     case 'csv':
//       if (data.length === 0) return '';

//       // Nagłówki
//       const headers = Object.keys(data[0]);
//       let csv = headers.join(',') + '\n';

//       // Wiersze
//       data.forEach(row => {
//         const values = headers.map(header => {
//           const value = row[header];

//           // Zabezpieczenie wartości dla CSV
//           if (value === null || value === undefined) {
//             return '';
//           } else if (typeof value === 'string') {
//             // Escape cudzysłowów i dodaj cudzysłowy jeśli trzeba
//             if (value.includes(',') || value.includes('"') || value.includes('\n')) {
//               return '"' + value.replace(/"/g, '""') + '"';
//             }
//             return value;
//           } else if (value instanceof Date) {
//             return value.toISOString();
//           } else if (typeof value === 'object') {
//             return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
//           }

//           return value;
//         });

//         csv += values.join(',') + '\n';
//       });

//       return csv;

//     case 'xlsx':
//       // Prosty obiekt dla konwersji na Excel (do użycia z biblioteką)
//       return {
//         headers: Object.keys(data[0]),
//         data: data.map(row => Object.values(row))
//       };

//     case 'json':
//     default:
//       return JSON.stringify(data);
//   }
// };

// module.exports = {
//   formatPatientData,
//   formatDate,
//   formatTime,
//   formatForExport
// };
