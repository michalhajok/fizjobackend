POST /api/auth/login # Logowanie użytkownika
POST /api/auth/logout # Wylogowanie użytkownika

GET /api/patients # Lista wszystkich pacjentów
GET /api/patients/:id # Szczegóły konkretnego pacjenta  
POST /api/patients # Dodanie nowego pacjenta

GET /api/appointments # Lista wszystkich terminów
GET /api/appointments/:id # Szczegóły konkretnego terminu
POST /api/appointments # Utworzenie nowego terminu
PUT /api/appointments/:id # Aktualizacja terminu
DELETE /api/appointments/:id # Usunięcie terminu

GET /api/employees # Lista wszystkich pracowników
GET /api/employees/:id # Szczegóły konkretnego pracownika
POST /api/employees # Dodanie nowego pracownika
PUT /api/employees/:id # Aktualizacja danych pracownika
DELETE /api/employees/:id # Usunięcie pracownika

POST /api/examinations # Utworzenie nowego badania
GET /api/examinations/:id # Pobieranie pojedynczego badania
GET /api/examinations/patient/:patientId # Pobieranie badań konkretnego pacjenta
PUT /api/examinations/:id # Aktualizacja badania
PATCH /api/examinations/:id/complete # Zakończenie badania
PATCH /api/examinations/:id/review # Weryfikacja badania przez specjalistę

POST /api/visits # Utworzenie nowej wizyty
GET /api/visits/:id # Pobieranie pojedynczej wizyty
GET /api/visits/patient/:patientId # Pobieranie wizyt pacjenta
GET /api/visits/employee/:employeeId # Pobieranie wizyt pracownika
PUT /api/visits/:id # Aktualizacja wizyty
PATCH /api/visits/:id/complete # Zakończenie wizyty
PATCH /api/visits/:id/cancel # Anulowanie wizyty

GET /api/schedules # Lista harmonogramów pracowników
GET /api/schedules/:id # Szczegóły harmonogramu
POST /api/schedules # Dodanie nowego harmonogramu
PUT /api/schedules/:id # Edycja harmonogramu
DELETE /api/schedules/:id # Usunięcie harmonogramu

GET /api/notifications # Lista powiadomień
GET /api/notifications/:id # Szczegóły powiadomienia
POST /api/notifications # Dodanie nowego powiadomienia
PUT /api/notifications/:id # Edycja powiadomienia
DELETE /api/notifications/:id # Usunięcie powiadomienia

GET /api/reports/patients # Raport pacjentów
GET /api/reports/visits # Raport wizyt
GET /api/reports/services # Raport usług

GET /api/admin/users # Lista użytkowników
POST /api/admin/users # Dodanie nowego użytkownika
PUT /api/admin/users/:id # Edycja użytkownika
DELETE /api/admin/users/:id # Usunięcie użytkownika

GET /health # Sprawdzenie stanu aplikacji
