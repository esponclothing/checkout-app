# Deployment & Git Rules

1. **checkout-app is deployed on Railway.** It connects to the Railway database and backend.
2. **Shopify-Price-Editor is deployed via GitHub to Railway.** It is safe to use Git inside the `Shopify-Price-Editor` directory, commit changes, and push to GitHub (`esponclothing/shopify-price-editor.git`) to trigger automatic Railway deployments.
3. **The Shopify theme (`11fit theme` / `Esponsports theme`) is pushed to GitHub.** Git commit or git push commands are safe and required inside the theme directories to deploy frontend changes.
