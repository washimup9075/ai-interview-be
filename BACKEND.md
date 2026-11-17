# AI Interview Backend

## 1. Backend Overview
The backend of the **AI Interview** project is a Node.js and Express application designed to serve as the API layer for a web-based interview practice platform. Its primary purposes are:
- **User Management & Authentication**: Secure sign-up, login, logout, and token-based session tracking.
- **Interview Generation**: Creating tailored interview sessions based on parameters like job role, experience level, and difficulty.
- **AI Integration**: Orchestrating calls to the Google Gemini API to generate custom interview questions dynamically.
- **Data Persistence**: Storing users, interview history, questions, answers, and AI-generated feedback in a MongoDB database.

---

## 2. Project Structure
The backend codebase is structured logically under the `backend` and `backend/src` directories:

```
backend/
├── .env                    # Environment variables (local, gitignored)
├── .gitignore              # Files and folders to ignore in Git
├── BACKEND.md              # Project documentation (this file)
├── package.json            # Node.js dependencies and scripts
├── package-lock.json       # Dependency lock file
├── server.js               # Entry point of the server
└── src/
    ├── app.js              # Express app setup and middleware configuration
    ├── controller/         # Request handling controllers (business logic)
    │   ├── auth.controller.js
    │   ├── interview.controller.js
    │   └── question.controller.js
    ├── db/                 # Database configuration and connection script
    │   └── db.js
    ├── middleware/         # Custom Express middleware (e.g. auth guard)
    │   └── auth.middleware.js
    ├── models/             # Mongoose schemas/models representing MongoDB collections
    │   ├── user.model.js
    │   ├── interview.model.js
    │   └── question.model.js
    ├── prompts/            # Construction logic for AI prompt templates
    │   └── interview.prompt.js
    ├── routes/             # Route configurations mapping endpoints to controllers
    │   ├── auth.route.js
    │   ├── interview.route.js
    │   └── question.route.js
    └── utils/              # Utility scripts for auth tokens and AI client helper
        ├── ai.js
        └── utils.js
```

---

## 3. Technologies Used
- **Node.js**: The JavaScript runtime environment.
- **Express**: minimalist web framework for managing routes and middleware.
- **MongoDB & Mongoose**: Object Data Modeling (ODM) library used to structure and query MongoDB.
- **Google Gen AI SDK (`@google/genai`)**: The official library used to communicate with the Gemini API.
- **JSON Web Token (`jsonwebtoken`)**: Used for cookie-based session token signing and verification.
- **bcryptjs**: Used to securely hash and compare user passwords.
- **cookie-parser**: Middleware to parse cookies attached to client requests.
- **dotenv**: Utility to load environment variables from the `.env` file into `process.env`.
- **cors**: Middleware to enable Cross-Origin Resource Sharing with the frontend client.

---

## 4. How the Backend Starts
1. **Startup Entry Point (`server.js`)**:
   - The server is started using `node server.js` (or via scripts `npm start` / `npm run dev`).
   - At the very first line of `server.js`, `import 'dotenv/config'` is executed to load the `.env` file before any other files are imported. This ensures all environment variables are available when sub-modules are evaluated.
   - It then imports `app` (`src/app.js`) and `connectToDB` (`src/db/db.js`).
2. **Database Initialization**:
   - `connectToDB()` is called. It calls `mongoose.connect(process.env.MONGODB_URL)` to connect asynchronously to MongoDB.
3. **HTTP Server Listening**:
   - The Express application starts listening on port `3000` and outputs: `Server is running on port 3000`.

---

## 5. Environment Variables
The application relies on the following environment variables. They must be set in a `.env` file in the root of the `backend` folder:

| Variable | Description | Example / Placeholder |
|---|---|---|
| `MONGODB_URL` | The MongoDB connection string (e.g., Atlas or local). | `mongodb+srv://<username>:<password>@cluster0.mongodb.net/dbname` |
| `GEMINI_API_KEY` | Your Google Gemini API Key. | `AIzaSy...` (Get from Google AI Studio) |
| `JWT_SECRET` | Secret key used to sign JSON Web Tokens. | `your_secret_jwt_key_here` |
| `NODE_ENV` | Running environment mode. Set to `development` for local testing. | `development` |

### Safe Example:
```env
MONGODB_URL=mongodb+srv://myuser:mypassword@cluster0.lc8tr.mongodb.net/Ai-interview?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=supersecretjwtkey123
NODE_ENV=development
```

---

## 6. MongoDB Connection
- The connection is established in `backend/src/db/db.js` using Mongoose:
  ```javascript
  mongoose.connect(process.env.MONGODB_URL)
  ```
- The connection string is retrieved from `process.env.MONGODB_URL`.
- **On Success**: Prints `"Connected to DB"` in the console.
- **On Failure**: Catches the error and prints it to the console (e.g., `MongoServerError: bad auth : authentication failed`). The server itself remains running on port 3000 even if the DB connection fails.

---

## 7. Gemini / AI Integration
- **SDK & Initialization**:
  Configured in `backend/src/utils/ai.js`. It imports `GoogleGenAI` from `@google/genai` and instantiates the client:
  ```javascript
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  ```
- **Execution Flow**:
  - The controller requests questions by calling `generateQuestions(prompt)`.
  - The utility makes an API call to the **`gemini-3.6-flash`** model:
    ```javascript
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    ```
  - The model outputs a JSON string containing the generated questions.
  - The helper parses the response using `JSON.parse(response.text)` and returns the resulting JavaScript array of questions.
- **Purpose**: Generates context-aware, structured technical or behavioral interview questions matching the candidate's exact specifications.

---

## 8. API Routes

| HTTP Method | Endpoint | Purpose | Request Body / Params | Response | Auth Required |
|---|---|---|---|---|---|
| **POST** | `/api/auth/signup` | Registers a new user account | `{ fullname, email, password }` | `{ _id, fullname, email }` (Sets JWT cookie) | No |
| **POST** | `/api/auth/login` | Authenticates existing user | `{ email, password }` | `{ _id, fullName, email }` (Sets JWT cookie) | No |
| **POST** | `/api/auth/logout` | Clears user auth token cookie | None | `{ message: "Logged out successfully" }` | No |
| **GET** | `/api/auth/check` | Returns current user details if logged in | None | User model data `{ _id, fullname, email }` | **Yes** |
| **POST** | `/api/interview/create` | Generates questions via AI and creates interview | `{ role, experience, interviewType, difficulty, numberOfQuestions }` | `{ success: true, message: "Interview created successfully", interviewId }` | **Yes** |
| **GET** | `/api/interview/all` | Lists all interviews of the user | None | `{ success: true, count, interviews: [...] }` | **Yes** |
| **GET** | `/api/interview/:id` | Fetches details of a single interview | Params: `id` | `{ success: true, interview: { ..., questions: [...] } }` | **Yes** |
| **DELETE** | `/api/interview/:id` | Deletes an interview and its questions | Params: `id` | `{ success: true, message: "Interview deleted successfully" }` | **Yes** |
| **GET** | `/api/questions/:id` | Gets details of a single question | Params: `id` | `{ success: true, question: { ... } }` | **Yes** |
| **GET** | `/api/questions/interview/:interviewId` | Gets all questions for an interview (stub) | Params: `interviewId` | *(Stub: needs implementation)* | **Yes** |

---

## 9. Controllers
- **`auth.controller.js`**:
  - `signup`: Validates input, hashes the user's password with `bcryptjs`, saves the user in MongoDB, issues a signed JWT cookie, and returns the registered user profile.
  - `login`: Looks up user by email, compares hashed password using `bcryptjs`, issues a signed JWT cookie, and returns user details.
  - `logout`: Clears the HTTP-only `token` cookie.
  - `checkAuth`: Instantly returns the authenticated user context stored in `req.user`.
- **`interview.controller.js`**:
  - `createInterview`: Constructs a customized generation prompt, triggers the Gemini API, bulk inserts the returned questions into MongoDB, links the question ObjectIds to the new interview document, and returns the interview's unique ID.
  - `getInterviews`: Fetches all interview history for the logged-in user sorted by most recent.
  - `getInterviewById`: Finds a specific interview record and populates all the nested question documents.
  - `deleteInterview`: Safely deletes the interview document and all associated question documents.
- **`question.controller.js`**:
  - `getQuestionById`: Looks up a specific question document by its MongoDB ObjectId.
  - `getQuestionsByInterview`: *(Empty placeholder stub).*

---

## 10. Models
- **`User`** (`src/models/user.model.js`):
  - `fullname` (String, required)
  - `email` (String, unique, required)
  - `password` (String, required, minimum length 6)
- **`Interview`** (`src/models/interview.model.js`):
  - `user` (ObjectId ref User, required)
  - `role` (String, required)
  - `experience` (Number, required, min 0)
  - `interviewType` (String, required, enum: `["MERN", "DSA", "HR", "System design", "Behavioral"]`)
  - `difficulty` (String, required, enum: `["Easy", "Medium", "Hard"]`)
  - `numberOfQuestions` (Number, required, min 1, max 20)
  - `status` (String, enum: `["Pending", "In Progress", "Completed"]`, default `Pending`)
  - `questions` (Array of ObjectIds ref Question)
- **`Question`** (`src/models/question.model.js`):
  - `interview` (ObjectId ref Interview, required)
  - `question` (String, required)
  - `answer` (String, default `""`)
  - `aiFeedback` (String, default `""`)
  - `score` (Number, default `0`, min 0, max 10)

---

## 11. Middleware
- **`auth.middleware.js`**:
  - Intercepts requests destined for protected routes.
  - Extracts the signed token from cookies (`req.cookies.token`).
  - Verifies the signature using `jwt.verify(token, process.env.JWT_SECRET)`.
  - Queries MongoDB for the matching user record, strips the hashed password using `.select("-password")`, and mounts the user object onto `req.user`.
  - Calls `next()` to proceed. If the token is missing or invalid, it returns `401 Unauthorized` or `400 Bad Request`.

---

## 12. Complete Request Flow
Here is the lifecycle of a request to create a new interview:

```
[Client App]
    │
    ▼  POST /api/interview/create  (with parameters & JWT Token Cookie)
[Express Server (src/app.js)]
    │
    ▼
[authMiddleware (src/middleware/auth.middleware.js)]
    │  - Extracts cookie "token"
    │  - Decodes token, verifies JWT_SECRET
    │  - Fetches User from DB, attaches to req.user
    ▼
[createInterview Controller (src/controller/interview.controller.js)]
    │  - Validates request body fields
    │  - Calls buildInterviewPrompt() with params
    ▼
[Gemini AI Utils (src/utils/ai.js)]
    │  - Submits generated prompt to Gemini 3.6-flash API
    │  - Receives JSON response with questions list
    ▼
[Database Interaction]
    │  - Creates Interview document
    │  - Inserts all generated Questions in bulk (insertMany)
    │  - Links Question ObjectIds to Interview.questions array
    ▼
[Client Response]
       - Sends 201 JSON response with "interviewId"
```

---

## 13. How to Install
Navigate to the backend directory and install the required dependencies:
```bash
cd backend
npm install
```

---

## 14. How to Configure
1. Create a `.env` file in the `backend` folder:
   ```bash
   touch backend/.env
   ```
2. Populate it with your database credentials and Gemini API Key:
   ```env
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.lc8tr.mongodb.net/Ai-interview?retryWrites=true&w=majority
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=supersecretjwtkey123
   NODE_ENV=development
   ```

---

## 15. How to Run
- **Development**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```
*Both scripts execute `node server.js` which is the official launcher.*

---

## 16. Testing
You can test the API endpoints using client tools like **Postman**, **Insomnia**, or **Thunder Client**:
1. **Sign Up**: Hit `POST http://localhost:3000/api/auth/signup` with `{ "fullname": "John Doe", "email": "john@example.com", "password": "securepassword" }`.
2. **Check Auth**: Hit `GET http://localhost:3000/api/auth/check`. It should return your user profile (cookie is automatically set and sent by the client tool).
3. **Create Interview**: Hit `POST http://localhost:3000/api/interview/create` with:
   ```json
   {
     "role": "React Developer",
     "experience": 3,
     "interviewType": "MERN",
     "difficulty": "Medium",
     "numberOfQuestions": 3
   }
   ```
   *Note: If MONGODB_URL is valid, it will save the questions and return an `interviewId`.*

---

## 17. Common Errors and Solutions

### 1. MongoDB Authentication Failure
- **Error**: `MongoServerError: bad auth : authentication failed`
- **Cause**: The password or username in the `MONGODB_URL` is incorrect, or contains raw special characters.
- **Solution**: Check your MongoDB Atlas credentials. If your password contains special characters (like `@`, `:`, `/`), URL encode them, or replace them.

### 2. Gemini API Initialization Timing Issue
- **Error**: `API key should be set when using the Gemini API.`
- **Cause**: In ES Modules, module imports are hoisted and executed before the regular code body (e.g. `config()`). Therefore, the Google Gen AI client was initialized before `dotenv` finished loading the `.env` variables.
- **Solution**: Import `'dotenv/config'` directly at the very top of `server.js`. This executes the dotenv configuration synchronously before any other module imports.

### 3. Syntax / ReferenceError on Logout
- **Error**: `ReferenceError: error is not defined`
- **Cause**: The `logout` function catch block was structured as `catch {` instead of `catch(error) {` but tried to output `error.message`.
- **Solution**: Bound the caught exception correctly using `catch(error)`.

### 4. JWT Cookie is not saved in Browser
- **Error**: Auth state is lost on page reload.
- **Cause**: `NODE_ENV` is set to `production` but the site is loaded over HTTP locally.
- **Solution**: Ensure `NODE_ENV` is set to `development` in the `.env` file.

---

## 18. Backend Architecture
The backend uses a standard model-view-controller (MVC) architecture without views (it is a pure REST API). 

```mermaid
graph TD
    Client[Client App] <--> Routes[Routes /api/*]
    Routes <--> Middleware[Auth Middleware]
    Middleware <--> Controllers[Controllers]
    Controllers <--> Models[Mongoose Models]
    Models <--> Database[(MongoDB Atlas)]
    Controllers <--> AIUtil[Gemini AI Utility]
    AIUtil <--> GeminiAPI[Google Gemini API]
```

---

## 19. Current Status
- **Success**: The server launches successfully and listens on port `3000`.
- **Fixed Issues**:
  1. Refactored the `dotenv` load timing inside `server.js` using `import 'dotenv/config'` at line 1. The warning `API key should be set when using the Gemini API` is resolved, and the Gemini API key is loaded successfully.
  2. Fixed a `ReferenceError` inside `auth.controller.js` catch block by updating `catch` to `catch(error)`.
  3. Verified the validity and responsiveness of the Gemini API Key and model (`gemini-3.6-flash`) using a diagnostic script.
- **Pending Tasks**:
  - The `MONGODB_URL` currently has a placeholder password `<your_mongodb_password>`. You must provide your actual MongoDB Atlas password in `backend/.env` for database operations to work.
