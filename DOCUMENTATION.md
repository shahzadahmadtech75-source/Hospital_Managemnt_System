# Hospital Management System

## 1. What This Project Is

The Hospital Management System (HMS) is a web application for organizing the daily work of a hospital in one place.

It provides:

- A public website where visitors can learn about the hospital, departments, and doctors.
- Secure accounts for patients and hospital employees.
- Separate dashboards for each type of user.
- Appointment scheduling and status tracking.
- Patient profiles and medical information.
- Prescriptions, admissions, beds, operations, reports, and invoices.
- Emergency requests for patients and emergency management for administrators.
- Internal messaging with live notifications.
- Image and PDF file uploads.

The system has two applications that work together:

1. **Frontend:** the website people see and use in their browser.
2. **Backend:** the API and database connection that process requests and store information.

The backend folder is named `Backened` in the current project. This is an existing folder name and is used in all commands below.

---

## 2. Who Uses the System

### Patient

Patients can:

- Create and manage their account.
- View and update their profile.
- Find doctors.
- Book and cancel appointments.
- View prescriptions and prescription details.
- View admissions and operations.
- View invoices and download invoice PDFs.
- Send and receive internal messages.
- Submit emergency requests.

### Doctor

Doctors can:

- Manage their profile and availability.
- View and manage appointments.
- View their patients.
- Create and manage prescriptions.
- Manage patient admissions.
- Create, update, and delete medical reports.
- Upload report PDFs.
- Send and receive internal messages.

### Nurse

Nurses can:

- Manage their profile.
- View and manage patients.
- Manage beds.
- Manage admissions and bed allotments.
- Manage medical reports.
- Upload report PDFs.
- Send and receive internal messages.

### Receptionist

Receptionists can:

- Register and update patients.
- Search for patients and doctors.
- Create and manage appointments.
- Cancel appointments and update appointment status.
- Manage their profile.
- Send and receive internal messages.

### Accountant

Accountants can:

- Create and manage invoices.
- Update invoice payment status.
- Look up patients, doctors, appointments, and admissions.
- Manage their profile.
- Send and receive internal messages.

### Administrator

Administrators can:

- View dashboard information.
- Create and manage users and staff.
- Activate or deactivate accounts.
- View staff and patient records.
- Create and manage departments.
- Monitor invoices, bed allotments, and reports.
- Manage hospital notices.
- Manage emergency requests.
- Manage their profile and password.
- Send and receive internal messages.

### Additional Role in the Data Model

The backend allows a `laboratorist` role in the user model. There is currently no matching frontend dashboard or complete laboratorist workflow in the visible application, so this role should be treated as reserved or incomplete.

---

## 3. How the System Works

A typical request follows this path:

1. A person clicks a button or opens a page in the React frontend.
2. The frontend sends a request to the backend API.
3. The backend checks the user's login token and role when the request is protected.
4. The controller performs the requested action.
5. Mongoose reads or updates the MongoDB database.
6. The backend sends a response back to the frontend.
7. The frontend displays the result, usually in the user's dashboard.

Live messaging follows an additional path through Socket.IO. Messages and typing indicators can be delivered immediately without refreshing the page.

---

## 4. Technology Stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios for API requests
- Socket.IO Client for live messaging
- Heroicons for interface icons
- React Hot Toast for notifications
- `date-fns` for date handling

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt for password hashing
- Socket.IO
- Multer for file uploads
- Cloudinary for storing uploaded files
- PDFKit for generating invoice PDFs
- CORS and cookie-parser for browser communication and cookies

### Project language

The application uses JavaScript with ES modules. The frontend uses JSX for React components.

---

## 5. Project Structure

```text
HMS/
|-- README.md                    Short project introduction
|-- DOCUMENTATION.md             This complete guide
|-- Backened/                    Node.js and Express API
|   |-- package.json              Backend dependencies and commands
|   |-- .env.example              Backend configuration template
|   `-- src/
|       |-- app.js                Express app and route registration
|       |-- server.js             Database connection and server startup
|       |-- config/               MongoDB and Cloudinary setup
|       |-- constants/             Shared constant values
|       |-- controllers/           Request handling and business logic
|       |-- middlewares/           Authentication, roles, and uploads
|       |-- models/                MongoDB data structures
|       |-- routes/                API URL definitions
|       |-- scripts/               Utility scripts such as admin seeding
|       |-- services/              Reusable service logic
|       |-- socket/                Live messaging server logic
|       |-- utils/                 Shared helper functions
|       `-- validators/            Request validation logic
|-- Frontend/                    React and Vite website
|   |-- package.json              Frontend dependencies and commands
|   |-- vite.config.js            Dev server and API proxy settings
|   `-- src/
|       |-- App.jsx               Browser routes and providers
|       |-- main.jsx              Frontend entry point
|       |-- api/                  Axios API configuration
|       |-- components/           Reusable interface pieces
|       |-- context/              Login and Socket.IO state
|       |-- hooks/                Reusable React hooks
|       |-- pages/                Public, login, and dashboard pages
|       |-- routes/               Frontend access protection
|       `-- utils/                Shared frontend helpers
```

### Important backend concepts

- **Routes** decide which URL and HTTP method are available.
- **Controllers** contain the main action for a request.
- **Models** describe the information stored in MongoDB.
- **Middleware** runs before a controller to check login status, roles, or uploaded files.
- **Configuration** connects the backend to external systems.

### Important frontend concepts

- **Pages** represent full screens such as dashboards.
- **Components** are reusable parts of screens.
- **Contexts** share login and live-connection state throughout the application.
- **Hooks** hold reusable frontend behavior.
- **Protected routes** prevent users from opening dashboards for roles they do not have.

---

## 6. Main Features

### Public website

Available without logging in:

- Home page
- About page
- Departments page
- Doctors page
- Contact page

The public pages use backend endpoints to show department and doctor information.

### Login and accounts

Users can register and log in. Passwords are stored as hashes rather than plain text. After login, the user is sent to the dashboard for their role.

The frontend stores the short-lived access token and basic user information in browser local storage. The longer-lived refresh token is stored by the backend in an HttpOnly cookie.

### Appointments

Appointments connect patients and doctors. Depending on the user's role, the system supports booking, viewing, updating, cancelling, completing, and changing appointment status.

### Medical records

The system separates account identity from medical and professional data. A user account may have a related patient, doctor, nurse, receptionist, or accountant profile.

The medical area includes prescriptions, admissions, beds, operations, and reports.

### Billing

Accountants manage invoices and payment status. Patients can view their invoices and download invoice PDFs generated by the backend.

### Emergency requests

Patients can submit emergency requests. Administrators can view, update, and delete emergency records.

### Internal messaging

Users can create or open conversations and exchange messages. Socket.IO adds live message delivery, typing indicators, read status, and new-message notifications.

### File uploads

Profile images and medical report PDFs can be uploaded. Multer receives the file and Cloudinary stores it. The application uses a 5 MB image limit and a 10 MB PDF limit where those upload handlers are used.

---

## 7. Backend API Overview

The backend uses the `/api/v1` prefix for application endpoints. The frontend's Axios client points to this prefix automatically.

### Public endpoints

- `GET /api/v1/public/departments`
- `GET /api/v1/public/doctors`
- `GET /api/v1/public/departments/:departmentId/doctors`

### Authentication endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

There are also cookie-check and user-list endpoints in the current code that appear intended for debugging or administration during development.

### Protected profile endpoint

- `GET /api/v1/protected/profile`

### Role-based endpoint groups

- `/api/v1/admin` for administrators
- `/api/v1/staff` for shared staff functions
- `/api/v1/receptionist` for reception workflows
- `/api/v1/patient` for patient profiles, appointments, records, and invoices
- `/api/v1/doctor` for doctor workflows
- `/api/v1/nurse` for nurse workflows
- `/api/v1/accountant` for billing workflows
- `/api/v1/emergency` for emergency requests
- `/api/v1/messages` for conversations and messages

### Health check

`GET /api/health` returns a success response when the backend is running. It is useful for checking whether the server is available without logging in.

---

## 8. Login and Permission Rules

The backend uses two checks:

1. **Authentication:** confirms that the request includes a valid access token.
2. **Authorization:** confirms that the logged-in user's role is allowed to use the requested feature.

Protected API requests use this header:

```text
Authorization: Bearer <access-token>
```

The frontend adds this header automatically through its Axios request interceptor. If the access token expires, the frontend calls the refresh endpoint using the HttpOnly cookie, saves the new access token, and retries the original request.

If the account is inactive, protected requests are rejected. If the user's role is not permitted, the backend returns an access-denied response and the frontend can show the unauthorized page.

---

## 9. Main Data Stored in MongoDB

The models are in `Backened/src/models/`.

- `User`: login identity, email, password hash, role, and account status.
- `PatientProfile`: patient personal and medical profile information.
- `DoctorProfile`: doctor information, department, and availability.
- `NurseProfile`: nurse information.
- `ReceptionistProfile`: receptionist information.
- `AccountantProfile`: accountant information.
- `Department`: hospital departments.
- `Appointment`: patient-doctor bookings, status, notes, and case history.
- `Prescription`: medicines and instructions connected to patients and doctors.
- `Admission`: patient admission and discharge information.
- `Bed`: hospital bed information and availability.
- `Operation`: operation or procedure information.
- `Report`: medical reports and uploaded documents.
- `Invoice`: invoice items, totals, and payment status.
- `Notice`: announcements created by administrators.
- `Emergency`: emergency requests.
- `Conversation`: participants in a message conversation.
- `Message`: individual messages and read status.

Most related records use MongoDB ObjectId references so that a record can be connected to its patient, doctor, appointment, admission, or user account.

---

## 10. Running the Project Locally

### Requirements

Install the following before starting:

- Node.js and npm
- MongoDB, either locally or through MongoDB Atlas
- A Cloudinary account if image or PDF uploads are needed

### 1. Configure the backend

Open a terminal in the backend folder:

```powershell
cd Backened
Copy-Item .env.example .env
```

Edit `.env` and provide the required values. The important values are described in the next section.

### 2. Install backend packages and start the API

```powershell
cd Backened
npm install
npm run dev
```

The backend normally starts on `http://localhost:5000` and its health check is:

`http://localhost:5000/api/health`

### 3. Install frontend packages and start the website

Open a second terminal:

```powershell
cd Frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

Vite forwards `/api` and `/socket.io` requests from the frontend to the backend on port `5000`.

### 4. Create the first administrator

The backend includes an admin seed script:

```powershell
cd Backened
npm run seed:admin
```

Use the credentials and configuration expected by the seed script. The administrator can then create or manage other users from the admin dashboard.

### Useful commands

Backend:

- `npm run dev`: start the backend with automatic restart using Nodemon.
- `npm run seed:admin`: run the administrator seed script.

Frontend:

- `npm run dev`: start the Vite development server.
- `npm run build`: create a production frontend build.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint checks.

The backend currently has no automated test command configured.

---

## 11. Environment Configuration

Create `Backened/.env` from `Backened/.env.example`.

| Variable | Purpose |
|---|---|
| `PORT` | Backend port. Defaults to `5000` when empty. |
| `MONGO_URI` | MongoDB connection string. |
| `ACCESS_TOKEN_SECRET` | Secret used to sign short-lived access tokens. |
| `REFRESH_TOKEN_SECRET` | Secret used to sign refresh tokens. |
| `ACCESS_TOKEN_EXPIRES_IN` | Access-token lifetime. The example uses `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh-token lifetime. The example uses `7d`. |
| `ADMIN_CREATION_SECRET` | Secret used by administrator creation logic. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `MAX_FILE_SIZE` | Upload size setting in bytes. The example is 5 MB. |
| `NODE_ENV` | Environment name such as `development` or `production`. |
| `FRONTEND_URL` | Frontend origin used by Socket.IO CORS configuration. |

Keep `.env` private. Never commit database credentials, token secrets, or Cloudinary secrets to source control.

The frontend currently uses the Vite proxy for local API communication, so it does not require a separate frontend environment file for the local setup.

---

## 12. Security and Data Protection

The current implementation includes:

- Password hashing with bcrypt.
- JWT access-token verification.
- HttpOnly refresh-token cookies.
- Role-based access control.
- Account activation and deactivation checks.
- Sensitive password and refresh-token fields hidden from normal model results.
- CORS configuration with credentials.
- Upload size restrictions.
- Centralized error handling.

Before production use, review these items carefully:

- Replace the placeholder production origin in `Backened/src/app.js` with the real frontend domain.
- Set strong, unique token secrets and keep them outside source control.
- Set the correct `FRONTEND_URL` for Socket.IO.
- Review the development/debug endpoints such as `/admin/test`, `/admin/create-admin`, `/auth/check-cookie`, and `/auth/users`.
- Configure HTTPS so access tokens and cookies are protected in transit.
- Confirm that every role has the intended dashboard and API permissions.
- Add automated tests for authentication, authorization, appointments, billing, and file uploads.

---

## 13. Where to Make Common Changes

### Change a page or dashboard

Look in `Frontend/src/pages/`. Each active role has a dashboard page, and dashboard tabs are generally in the matching folder under `Frontend/src/components/`.

### Add or change a browser URL

Update `Frontend/src/App.jsx` for frontend routes. Use `ProtectedRoute` when a page requires a login or a specific role.

### Add or change an API endpoint

1. Add the URL definition in the appropriate file under `Backened/src/routes/`.
2. Put request behavior in the matching controller under `Backened/src/controllers/`.
3. Use authentication and role middleware for protected behavior.
4. Update or add a model under `Backened/src/models/` if new data is required.
5. Update the frontend API call and user interface.

### Change login behavior

- Backend login and token handling: `Backened/src/controllers/auth.controller.js`.
- Token verification: `Backened/src/middlewares/auth.middleware.js`.
- Role checks: `Backened/src/middlewares/role.middleware.js`.
- Frontend login state: `Frontend/src/context/AuthContext.jsx`.
- Frontend request token handling: `Frontend/src/api/axiosInstance.js`.

### Change live messaging

- Server setup: `Backened/src/socket/`.
- Message API: `Backened/src/routes/message.routes.js` and its controller.
- Frontend connection and events: `Frontend/src/context/SocketContext.jsx`.
- Messaging screens: `Frontend/src/components/messages/`.

### Change uploaded files

Review the upload middleware, Cloudinary configuration, and the controller handling the relevant profile or report upload.

---

## 14. Troubleshooting

### The frontend cannot reach the backend

- Confirm that the backend is running on port `5000`.
- Confirm that the frontend is running on port `3000`.
- Open `http://localhost:5000/api/health`.
- Check that Vite's proxy target still points to `http://localhost:5000`.

### The backend stops during startup

- Check that `MONGO_URI` exists and is valid.
- Confirm that MongoDB is running or that the Atlas network access rules allow the connection.
- Check the backend terminal for the exact error.

### Login succeeds but a dashboard does not open

- Check that the returned user has one of the supported dashboard roles.
- Check that the access token exists in browser local storage under `hms_access_token`.
- Check that the user account is active.

### Messages are not live

- Confirm that both frontend and backend are running.
- Confirm that the `/socket.io` Vite proxy is enabled.
- Confirm that the access token is available to the Socket.IO client.
- Check the browser console and backend terminal for connection errors.

### Uploads fail

- Check the file type and size.
- Confirm Cloudinary variables are configured.
- Check that the relevant route uses the correct upload middleware.

---

## 15. Current Scope and Notes

This guide describes the application as it exists in the repository. Some areas may still be under development:

- The backend test script is a placeholder and automated tests are not currently configured.
- The `laboratorist` role exists in the user schema but does not currently have a complete dashboard workflow.
- Production CORS configuration still contains a placeholder domain and must be changed before deployment.
- Some authentication and administrator endpoints are marked or structured like development/debug endpoints and should be reviewed before production.

For a quick introduction, see [README.md](README.md). For implementation details, start with `Backened/src/server.js`, `Backened/src/app.js`, and `Frontend/src/App.jsx`.
