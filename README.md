# 🚀 Spectral AI: Quick Start Guide

Welcome to the **Approval-Gated Assistant**! This guide is designed to help you get this powerful, human-in-the-loop AI agent up and running on your local machine from scratch. 

If you are a first-time user and don't have any API keys configured yet, don't worry! We will walk you through cloning the repository, setting up the TrueForge backend (running on `localhost:8000`), adding your own API keys to it, and finally running the frontend (running on `localhost:5000`).

Let's get building! 🛠️

---

## 1. 📦 Prerequisites

Before we dive in, make sure your development environment has the following tools installed:

- **[Node.js](https://nodejs.org/en/download/)** (v18.x or later recommended)
- **Package Manager**: **[npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)** (comes with Node.js) or **[Yarn](https://yarnpkg.com/getting-started/install)**
- **[Git](https://git-scm.com/downloads)**: To clone the repository
- **[Python](https://www.python.org/downloads/)** (often required for the TrueForge backend)

---

## 2. 📥 Cloning the Repository & Downloading TrueForge

First, you need to get the source code for both the Approval-Gated Assistant frontend and the TrueForge backend. 

Open your terminal and run the following commands:

```bash
# Clone the repository
git clone https://github.com/your-username/approval-gated-assistant.git

# Navigate into the project directory
cd approval-gated-assistant
```

*(Note: Depending on how your project is structured, the TrueForge backend might be included in a subfolder like `server/` or `backend/`, or it might be a separate repository. We will assume it's located in the `server/` directory for this guide).*

---

## 3. ⚙️ Setting Up the TrueForge Backend (`localhost:8000`)

The TrueForge backend acts as the engine for the assistant. You'll need to configure it with your API keys (such as Groq, Notion, or OpenAI) before running it.

### Adding Your API Keys
You don't need any API keys to just view the code, but to make the agent functional, you will need to add them to the backend server.

1. Navigate to the backend directory:
   ```bash
   cd server
   ```
2. Create a new environment variable file:
   ```bash
   cp .env.example .env
   ```
   *(If there is no `.env.example`, simply create a new file named `.env`)*
3. Open the `.env` file in your code editor and add your API keys. It should look something like this:
   ```env
   # TrueForge Backend Environment Variables
   PORT=8000
   
   # Add your specific API keys here when you get them:
   # GROQ_API_KEY="your_groq_api_key"
   # NOTION_API_KEY="your_notion_api_key"
   ```

### Running the Backend
Once your `.env` is set up, install the dependencies and start the TrueForge server.

```bash
# Install backend dependencies (e.g., using npm)
npm install

# Start the TrueForge backend server
npm start
```
🎉 The TrueForge backend should now be running at **http://localhost:8000**. Keep this terminal window open!

### 🔑 First-Time TrueForge Configuration

Because TrueForge stores its configurations securely in a local SQLite database, you **must** manually add your API keys through its dashboard the very first time you run it.

1. Once the backend is running, open **[http://localhost:8000](http://localhost:8000)** in your browser.
2. Go to the **Providers** (or Models) tab. Click "Add Provider", select **Groq**, and paste your Groq API key (`gsk_...`).
3. Go to the **Skills** (or Tools) tab. Configure the **Daytona** sandbox and paste your Daytona API key (`dtn_...`).
4. Save your changes. These will be permanently saved to your local database so you only have to do this once!

### Making Changes to the Backend
If you need to modify how the agent handles approvals or add new tools, you can edit the files within the `server/` directory. The backend will typically auto-reload or require a restart (e.g., `npm run dev`) depending on your setup.

---

## 4. 🎨 Running the Frontend (`localhost:5000`)

With the TrueForge backend running, it's time to start the frontend user interface.

1. Open a **new** terminal window (leave the backend running in the first one).
2. Navigate to the root directory of your cloned repository:
   ```bash
   cd The-Agent-Harness
   ```
3. Create the frontend environment variable file:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and add your Groq API key for transcription support:
   ```env
   # Frontend Environment Variables
   VITE_TRUEFORGE_URL=/
   GROQ_API_KEY="your_groq_api_key"
   ```
5. Install the frontend dependencies:
   ```bash
   npm install
   ```
6. Start the frontend development server on port 5000:
   ```bash
   # If your package.json has a dev script configured for port 5000
   npm run dev
   ```
   *(Note: You can force it to run on port 5000 by using `PORT=5000 npm run dev` on Mac/Linux or setting it in your `.env.local` file).*

🎉 **Success!** Open your browser and navigate to **[http://localhost:5000](http://localhost:5000)**. 

You should now see the Approval-Gated Assistant interface, successfully communicating with your TrueForge backend!

---

*Need help? Feel free to open an issue on our GitHub repository. Happy coding!*
