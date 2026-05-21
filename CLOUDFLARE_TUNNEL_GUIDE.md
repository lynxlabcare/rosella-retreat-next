# Cloudflare Tunnel Sharing Guide

This guide provides step-by-step instructions for sharing a local Next.js website with clients using Cloudflare Tunnels. This methodology guarantees that the shared site works perfectly, bypassing common issues related to Hot Module Replacement (HMR) and WebSockets that occur when tunneling a development server.

## 🛑 Important Prerequisite: Use Production, Not Dev Mode

**Why?** If you run `npm run dev` and tunnel it, the client-side interactivity (like Framer Motion animations, clickable tabs, and images loaded by client components) will break. This happens because Next.js development mode relies on a WebSocket connection for Hot Module Replacement (HMR). Cloudflare's free quick tunnels often drop these WebSockets, causing React hydration to fail.

To fix this, we **must** build and serve the project in **production mode** before tunneling.

---

## Step 1: Clean Up Existing Servers

Before starting, ensure port 3000 is free by killing any running Next.js dev servers.

1. In your terminal, run the following command to find and kill processes on port 3000:
   ```bash
   lsof -ti :3000 | xargs kill -9 2>/dev/null; echo "done"
   ```

## Step 2: Build the Project

Build the Next.js project to generate static assets and optimized production bundles. This step ensures that WebSockets are not required for the site to render.

1. Run the build command:
   ```bash
   npm run build
   ```
   *(Note: Ensure there are no TypeScript errors, as a failed build will prevent the production server from starting. If errors occur, fix them and run the build again.)*

## Step 3: Start the Production Server

Once the build succeeds, start the Next.js server in production mode.

1. Run the start command:
   ```bash
   npm run start
   ```
2. You should see an output indicating the server is running (e.g., `Ready in Xms` on `http://localhost:3000`).
3. **Leave this terminal window open.**

## Step 4: Download the `cloudflared` Binary

If Homebrew is not installed or available, you can directly download the `cloudflared` binary into your temporary directory (`/tmp`). 

> **Note:** The `/tmp` directory is cleared every time your Mac restarts. You will need to run this download step again if you reboot your machine.

1. Open a **new, separate terminal window** (do not close the one running `npm run start`).
2. Run the following command to download, extract, and make the binary executable:
   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz -o /tmp/cloudflared.tgz && \
   tar -xzf /tmp/cloudflared.tgz -C /tmp && \
   chmod +x /tmp/cloudflared && \
   echo "cloudflared is ready"
   ```

## Step 5: Start the Cloudflare Tunnel

With the production server running in one terminal and `cloudflared` downloaded, it's time to create the tunnel.

1. In the terminal where you downloaded `cloudflared`, run:
   ```bash
   /tmp/cloudflared tunnel --url http://localhost:3000
   ```
2. Wait a few seconds. The terminal will output a block of text containing a URL that looks like this:
   `https://[random-words].trycloudflare.com`
3. **Copy this URL**. This is the live, shareable link you can send to your client.
4. **Leave this terminal window open.**

---

## 🧹 How to Stop the Tunnel

When you are finished sharing the site with the client:
1. Go to the terminal running the `cloudflared` tunnel and press `Ctrl + C` to terminate it. The shareable link will immediately stop working.
2. Go to the terminal running `npm run start` and press `Ctrl + C` to stop the production server.
3. You can now safely resume development using `npm run dev`.
