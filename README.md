# Google Calendar Integration with Google Authentication

## Overview
This project demonstrates how to integrate Google Calendar into a web application with Google account authentication. It allows users to authenticate via Google OAuth 2.0 and interact with their Google Calendar events. The backend is built using **Express.js** with **MySQL**, while the frontend is developed using **React.js** with **FullCalendar** for calendar UI.

## Tech Stack
- **Frontend**: React.js, Vite, FullCalendar
- **Backend**: Express.js, MySQL, Google APIs
- **Database**: MySQL
- **Authentication**: Passport.js with Google OAuth 2.0

## Required Packages
### Backend
The following dependencies are required for Google Calendar integration and authentication:

```json
"dependencies": {
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "mysql2": "^3.12.0",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "googleapis": "^144.0.0"
}
```

### Frontend
The frontend uses **FullCalendar** for displaying events and **axios** for API requests:

```json
"dependencies": {
  "@fullcalendar/daygrid": "^6.1.15",
  "@fullcalendar/interaction": "^6.1.15",
  "@fullcalendar/react": "^6.1.15",
  "@fullcalendar/timegrid": "^6.1.15",
  "axios": "^1.7.9",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.2.0"
}
```

## Setup Instructions
### Backend Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/JisuKayl/GoogleCalendar_IntegrationTest.git
   cd server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and configure your credentials:
   ```ini
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=mysql
   DB_NAME=googlecalendar_db
   SESSION_SECRET=session_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Start the backend server:
   ```sh
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `client` folder:
   ```sh
   cd client
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the frontend application:
   ```sh
   npm run dev
   ```

## Features
- Google OAuth 2.0 authentication
- Retrieve and display Google Calendar events
- Add and manage events via API

## Notes
- Ensure you have a **Google Cloud Project** with OAuth credentials set up.
- Redirect URIs in Google Developer Console should match your backend endpoints.
- The project is for testing purposes only and does not use production security measures.

## License
This project is licensed under the MIT License.


![image](https://github.com/user-attachments/assets/3fb20f67-fe04-4ae3-ba22-0b14617a2621)
![image](https://github.com/user-attachments/assets/1a4180b1-1c63-403e-a8dd-c6be84bcf2b8)
![image](https://github.com/user-attachments/assets/67e3f0d9-0283-4a68-ad09-a9265b75cc73)
![image](https://github.com/user-attachments/assets/c2fa9807-1838-4600-9fc9-e5f77b1542e2)
![image](https://github.com/user-attachments/assets/3e51fe2b-42db-4c1a-8186-5f4120708c1f)
![image](https://github.com/user-attachments/assets/388a7215-2495-4fab-9fd2-ee45169c7931)

Proof of Integration

Below is a screenshot of an actual Google Calendar showing events created through this system, proving that the integration works successfully.
![image](https://github.com/user-attachments/assets/84b3a258-a943-470a-8404-953954427cce)

This confirms that events added in the system are successfully reflected in the user's Google Calendar.

