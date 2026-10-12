# Enterprise User Hub (.NET Web API + Angular Reactive Interface)

A full-stack application featuring a modern **Angular 22** client and an **ASP.NET Core Web API** backend.

---

## 🚀 Key Features

### 1. Two-Tab Interface
- **Tab 1: Registration Form**: Clean, accessible reactive form for registering and editing user records.
- **Tab 2: User Records & Directory**: Displays all records fetched via Angular Service from the .NET GET endpoint.
- **API Status Indicator & Config Modal**: Dynamic header badge showing live API status. Allows configuring the .NET API URL at runtime.
- **Seamless Local Persistence Mode**: If the .NET API is offline, the app automatically switches to local persistence fallback mode so all functionality (Add, Edit, Delete, Search) remains 100% testable.

### 2. Tab 1: Validated Reactive Form
All fields are strictly validated before submission:
- **First Name & Last Name**: Required, minimum 2 characters, alphabetic characters only.
- **Email**: Required, RFC-compliant email pattern validation.
- **Birthday**: Required, custom past-date validator (prevents future dates) with automated age calculation.
- **Location (Pop Up Dropdown Menu)**: Searchable modal dropdown with quick-selection for major cities and support for custom location input.
- **Gender (Radio Buttons)**: Custom radio options for Male, Female, and Other / Non-Binary.
- **Using Technologies (Checkboxes)**: Checkbox grid with a custom validator ensuring at least one technology is selected.
- **Edit Mode Support**: Selecting a user to edit from Tab 2 populates the reactive form with their details and allows updating via `PUT /api/users/{id}`.

### 3. Tab 2: User Records, Search, Edit & Delete
- **Top Search Bar**: Real-time filtering by **First Name**, **Last Name**, or **Email** with dynamic match counter.
- **View Toggle**: Switch between **Table View** and **Grid Cards View**.
- **Edit Action**: Loads user details directly into Tab 1 with edit mode activated.
- **Delete Action**: Deletion confirmation modal before executing `DELETE /api/users/{id}` on the .NET API.
- **Refresh Sync**: One-click sync button to fetch the latest records from the backend.

### 4. Companion ASP.NET Core Web API
- `GET /api/users`: Retrieve all user records.
- `GET /api/users/{id}`: Retrieve single user record.
- `POST /api/users`: Create a new user record.
- `PUT /api/users/{id}`: Update an existing user record.
- `DELETE /api/users/{id}`: Delete a user record.
- CORS enabled for Angular frontend (`http://localhost:4200`).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- .NET 8 / 9 / 10 SDK

### 1. Start the .NET Web API
```powershell
dotnet run --project DotNetApi
```
The API will start listening on: `http://localhost:5000`

### 2. Start the Angular Client
In a separate terminal:
```powershell
npm install
npm start
```
The application will launch on: `http://localhost:4200`

---

## 📁 Project Structure

```
├── DotNetApi/                       # ASP.NET Core Web API backend
│   ├── Program.cs                   # Endpoints, CORS & User store
│   └── Properties/launchSettings.json
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── user-form/           # Reactive Form (Tab 1)
│   │   │   └── user-list/           # Records, Search & CRUD (Tab 2)
│   │   ├── models/
│   │   │   └── user.model.ts        # TypeScript User interface
│   │   ├── services/
│   │   │   └── user.service.ts      # Angular HttpClient Service
│   │   ├── app.ts                   # Two-Tab Shell & Header
│   │   ├── app.html
│   │   └── app.css
│   └── styles.css                   # Global Dark Slate & Indigo theme
├── angular.json
└── package.json
```
