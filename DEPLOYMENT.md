# Deployment Guide

## GitHub Pages Deployment

### Prerequisites

1. Create a GitHub repository named `DreamHelper` (or your preferred name)
2. Ensure you're on the master branch

### Initial Setup

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/DreamHelper.git

# Push your code
git push -u origin master
```

### Deploy to GitHub Pages

```bash
# Build and deploy in one command
npm run deploy
```

This will:
1. Build the production bundle
2. Create/update a `gh-pages` branch
3. Push the built files to GitHub Pages

### Configure GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select the `gh-pages` branch
4. Click **Save**

Your app will be live at: `https://YOUR_USERNAME.github.io/DreamHelper/`

### Important Notes

- The `base: "/DreamHelper/"` in `vite.config.ts` must match your repository name
- If you rename the repo, update the base path in `vite.config.ts`
- GitHub Pages may take 1-2 minutes to update after deployment

### Updating the Live Site

Every time you want to update the live site:

```bash
# Make your changes, commit them
git add .
git commit -m "your changes"
git push

# Then deploy
npm run deploy
```

### Files Ignored by Git

The following files are in `.gitignore`:
- `node_modules/` - npm dependencies
- `dist/` - build output
- `PROJECT_CONTEXT.md` - AI context file
- `wiki_response.html` - temporary files
- `*.log` - log files
- `.DS_Store` - macOS system files

All of these should **not** be committed to the repository.
