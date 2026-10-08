# Deployment Guide for UniDeal Campus Marketplace

This application is built with a **Node.js/Express backend** and a **React + Vite frontend** that can be hosted together as a single unified service on **Render (Free)**.

---

## Method 1: Deploy on Render via GitHub (Easiest & Free)

### Step 1: Push Project to GitHub

If you haven't already pushed your project to a GitHub repository:

1. Open your terminal in this project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of UniDeal Campus Marketplace"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push your local code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

### Step 2: Create a Free Web Service on Render

1. Sign up or log in to **[Render.com](https://render.com/)**.
2. On your Render dashboard, click **"New +"** and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and connect your GitHub repository.
4. Fill in the service details:
   - **Name**: `unideal-marketplace` (or any name you choose)
   - **Region**: Choose the closest region to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install --include=dev && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm start
     ```
   - **Instance Type**: Select **Free** ($0/month)

---

### Step 3: Add Environment Variables

In the **Environment Variables** section on the same page, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode & SPA serving |
| `JWT_SECRET` | *(Click "Generate" or type a secret key)* | For student auth tokens |
| `CLIENT_URL` | `*` | Allows standard requests |

*(Note: Render automatically assigns the `PORT` environment variable, which the server reads automatically).*

---

### Step 4: Click "Deploy Web Service"

1. Click **"Deploy Web Service"** at the bottom.
2. Render will run:
   - `npm install --include=dev` (installs dependencies)
   - `npm run build` (compiles the React/Vite frontend into `dist/`)
   - `npm start` (starts the Express server, which serves both the API endpoints and the frontend SPA)
3. Once the build finishes (takes ~2 minutes), Render will provide you with a public URL:
   ```
   https://unideal-marketplace.onrender.com
   ```
4. Click the link to open your live website!

---

## Method 2: One-Click Render Blueprint

Because this repository includes a [`render.yaml`](file:///c:/Users/kumar/Downloads/Generate%20Clean%20JSON%20Structure/render.yaml) file:

1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **"New +"** -> **"Blueprint"**.
3. Select your GitHub repository.
4. Render will automatically read `render.yaml` and configure the build command, start command, and health check for you.
5. Click **"Apply"** to deploy!

---

## How It Works in Production

- **Single URL**: Both frontend routes (`/`, `/categories`, etc.) and backend routes (`/api/...`, `/uploads/...`) are served from the same domain.
- **Zero CORS Issues**: Because client and server share the same origin, API calls and image uploads work seamlessly.
- **File Uploads**: When a seller uploads an item image, it is stored in `server/uploads/` and served statically via `/uploads/...`.
- **Pre-seeded Campus Data**: When the backend first starts up, it automatically initializes demo students and campus listings.
