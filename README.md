---
title: Global College LMS
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Global College LMS

A fullstack Learning Management System (LMS) built with React, Node.js, Express, and PostgreSQL (via Neon DB and Drizzle ORM).

## Deployment on Hugging Face Spaces

This project is configured to deploy directly on Hugging Face Spaces using the **Docker SDK**.

### Configuration Highlights
* **SDK:** Docker
* **Exposed Port:** `7860` (defined in both `Dockerfile` and Space metadata)
* **Node Environment:** Production builds are optimized and compiled on deployment

### Environment Variables
When creating your Hugging Face Space, make sure to add the following **Variables and Secrets** under the Space Settings:
1. `DATABASE_URL` (Secret): Your connection URL to your PostgreSQL database.
2. `JWT_SECRET` (Secret): Secret key for authentication.
3. `JWT_REFRESH_SECRET` (Secret): Secret key for refresh tokens.
4. `CLOUDINARY_CLOUD_NAME` (Variable): Cloudinary configuration for file uploads (optional).
5. `CLOUDINARY_API_KEY` (Variable): Cloudinary API key (optional).
6. `CLOUDINARY_API_SECRET` (Secret): Cloudinary API secret (optional).

## Local Development

To run the application locally, refer to the project configuration and execute:

```bash
# Install dependencies
pnpm install

# Run the dev servers (parallel frontend & backend)
pnpm run dev
```
