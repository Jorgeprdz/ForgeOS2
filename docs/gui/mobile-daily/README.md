# Forge Mobile Daily GUI

This directory contains the static, mobile-first frontend for the Forge Alpha semantic extraction interface.

## Deployment to GitHub Pages

To deploy this interface to GitHub Pages:

1.  **Push** your changes to the `main` branch of your repository.
2.  Go to your repository **Settings** on GitHub.
3.  Click on **Pages** in the left sidebar.
4.  Under **Build and deployment** > **Source**, ensure it is set to **Deploy from a branch**.
5.  Under **Branch**, select `main` and change the folder from `/(root)` to `/docs`.
6.  Click **Save**.

After a few minutes, the site will be live at:
`https://<your-username>.github.io/<your-repo-name>/`

The GUI will automatically be accessible at that URL, or specifically at:
`https://<your-username>.github.io/<your-repo-name>/gui/mobile-daily/index.html`

## Configuration

The application uses the `SUPABASE_ANON_KEY` defined in `docs/gui/mobile-daily/app.js`. Ensure this key is set correctly for your Supabase project.

> [!WARNING]
> Do **not** expose or commit the `GEMINI_API_KEY` in any frontend files.
