# Deployment til Vercel

## Steg for deployment

1. **Push kode til GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Bedriftssøk app"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Koble til Vercel**
   - Gå til [vercel.com](https://vercel.com)
   - Logg inn med GitHub
   - Klikk "New Project"
   - Velg ditt GitHub repository
   - Vercel vil automatisk oppdage at det er en Next.js app

3. **Konfigurer miljøvariabler (hvis nødvendig)**
   - Ingen miljøvariabler kreves for denne appen
   - BRREG API er offentlig tilgjengelig

4. **Deploy**
   - Klikk "Deploy"
   - Vercel vil bygge og deploye appen automatisk
   - Du får en URL som du kan dele

## Automatisk deployment

- Hver gang du pusher til `main` branch, vil Vercel automatisk redeploye
- Du kan også sette opp preview deployments for andre branches

## Custom domain

- I Vercel dashboard kan du legge til et custom domain
- SSL sertifikat blir automatisk generert

## Monitoring

- Vercel gir deg analytics og performance metrics
- Error tracking er tilgjengelig
- Logs kan ses i dashboard
