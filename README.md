# Online Quiz Management System

A Node.js, Express, EJS, and MongoDB based online quiz management system with admin, teacher, and student features.

## Requirements

Before running this project on another device, install:

- **Git** for cloning the repository
- **Node.js and npm** for running the application
- **MongoDB** locally, or a MongoDB Atlas database connection

Check that Node.js and npm are installed:

```bash
node -v
npm -v
```

## Clone The Project

```bash
git clone <your-repository-url>
cd "Online quiz management system"
```

Replace `<your-repository-url>` with your GitHub repository URL.

## Install Dependencies

Install all project packages from `package.json`:

```bash
npm install
```

Main dependencies used in this project include:

- `express`
- `mongoose`
- `ejs`
- `ejs-mate`
- `passport`
- `passport-local`
- `passport-google-oauth20`
- `bcryptjs`
- `express-session`
- `connect-mongo`
- `dotenv`
- `method-override`
- `validator`

Development dependency:

- `nodemon`

## Environment Setup

Create a `.env` file from the example file:

```bash
copy .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Then update the values inside `.env` if needed:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/quiz-management-system
SESSION_SECRET=your_session_secret_key_here_change_in_production

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

PORT=3000
NODE_ENV=development
```

Google OAuth values are optional unless you want to use Google login.

## Database Setup

If you are using local MongoDB, make sure the MongoDB server is running before starting the app.

Default local database URL:

```env
mongodb://127.0.0.1:27017/quiz-management-system
```

If you are using MongoDB Atlas, replace `MONGODB_URI` in `.env` with your Atlas connection string.

## Run The Project

For development mode:

```bash
npm run dev
```

For normal start:

```bash
npm start
```

Then open the app in your browser:

```text
http://localhost:3000
```

## Important Notes


- Do not upload `node_modules` to GitHub.
- Do not upload your real `.env` file to GitHub.
- Another device only needs to run `npm install` after cloning the project.
- Keep `.env.example` in the repository so other users know which environment variables are required.

## Website link: https://online-quiz-management-system-nphc.onrender.com
