# Backend Aplikacji Fizjoterapeutycznej

Ten projekt stanowi kompleksowy backend dla aplikacji obsługującej placówkę fizjoterapeutyczną, stworzony przy użyciu Express.js z MongoDB jako bazą danych.

## Funkcjonalności

- Rejestr pacjentów
- Rejestr pracowników 
- Szczegółowa karta badania fizjoterapeuty 
- Historia wizyt
- Rejestr usług placówki
- Harmonogramy pracy pracowników
- Terminarze wizyt
- System powiadomień (e-mail, push)
- Konfigurowalne ustawienia placówki
- Wydruki dokumentacji
- Generowanie raportów 
- Panel administracyjny
- Zarządzanie bezpieczeństwem
- Wystawianie dokumentów i e-dokumentów
- System logowania operacji

## Struktura Projektu

```
physiotherapy-clinic-backend/
├── src/
│   ├── config/           # Konfiguracja aplikacji
│   ├── controllers/      # Logika biznesowa
│   ├── middleware/       # Middleware aplikacji
│   ├── models/          # Modele MongoDB
│   ├── routes/          # Definicje tras API
│   ├── services/        # Usługi biznesowe
│   ├── utils/           # Narzędzia pomocnicze
│   ├── websocket/       # Obsługa WebSockets
│   ├── app.js           # Konfiguracja Express
│   └── server.js        # Punkt wejścia
├── public/
│   └── templates/       # Szablony dokumentów
├── tests/               # Testy jednostkowe i integracyjne
├── logs/                # Pliki logów
└── uploads/             # Przesyłane pliki
```

## Wymagania

- Node.js (v14.x lub nowszy)
- MongoDB (v4.x lub nowszy)
- NPM lub Yarn

## Instalacja

1. Sklonuj repozytorium:
   ```
   git clone [url-repozytorium]
   cd physiotherapy-clinic-backend
   ```

2. Zainstaluj zależności:
   ```
   npm install
   ```

3. Skonfiguruj zmienne środowiskowe:
   ```
   cp .env.example .env
   ```
   Następnie edytuj plik `.env` i dostosuj konfigurację.

## Uruchomienie

### Tryb rozwojowy
```
npm run dev
```

### Tryb produkcyjny
```
npm start
```

## Testy
```
npm test
```

## Dokumentacja API

API jest zorganizowane wokół zasobów RESTful. Używa standardowych metod HTTP, zwraca kody statusów HTTP i obsługuje autoryzację poprzez tokeny JWT.

### Główne Endpointy

- `/api/auth` - Zarządzanie autentykacją
- `/api/patients` - Zarządzanie pacjentami
- `/api/employees` - Zarządzanie pracownikami
- `/api/examinations` - Zarządzanie badaniami
- `/api/visits` - Zarządzanie wizytami
- `/api/schedules` - Zarządzanie harmonogramami
- `/api/appointments` - Zarządzanie terminami
- `/api/services` - Zarządzanie usługami
- `/api/documents` - Zarządzanie dokumentami
- `/api/reports` - Generowanie raportów
- `/api/settings` - Ustawienia placówki

## Bezpieczeństwo

- Autentykacja JWT z refresh tokenami
- Kontrola dostępu oparta na rolach (RBAC)
- Szyfrowanie wrażliwych danych
- Walidacja danych wejściowych
- Limity rate'owania
- Zabezpieczenia nagłówków HTTP
- Logowanie aktywności

## Licencja

ISC
