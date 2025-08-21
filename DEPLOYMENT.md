# 🚀 PhotonX Deployment Guide

## Quick Deploy Options

### 🔥 One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ChikamsoChidebe/Photonx)

### 🐳 Docker Deploy
```bash
git clone https://github.com/ChikamsoChidebe/Photonx.git
cd Photonx
docker-compose up -d
```

### 📦 Manual Deploy
```bash
git clone https://github.com/ChikamsoChidebe/Photonx.git
cd Photonx
npm install
npm run build
npm run start
```

## 🌐 Platform-Specific Deployments

### Vercel (Recommended)
1. **Connect Repository**
   - Import from GitHub: `ChikamsoChidebe/Photonx`
   - Framework: Next.js
   - Root Directory: `apps/web`

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_CHAIN_ID=1
   NEXT_PUBLIC_COORDINATOR_URL=https://api.photonx.network
   NEXT_PUBLIC_SETTLEMENT_CONTRACT=0x...
   ```

3. **Deploy**
   - Automatic deployment on push to `main`
   - Preview deployments for PRs

### Netlify
1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `apps/web/.next`
   - Node version: 18

2. **Environment Variables**
   - Same as Vercel configuration

### Railway
1. **Connect Repository**
   - Import from GitHub
   - Select `apps/web` as root

2. **Configuration**
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm start"
     }
   }
   ```

### AWS Amplify
1. **Connect Repository**
   - Choose GitHub repository
   - Branch: `main`

2. **Build Settings**
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: apps/web/.next
           files:
             - '**/*'
   ```

## 🔧 Environment Configuration

### Production Environment
```env
# Core Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=PhotonX
NEXT_PUBLIC_CHAIN_ID=1

# API Endpoints
NEXT_PUBLIC_COORDINATOR_URL=https://api.photonx.network
NEXT_PUBLIC_WS_URL=wss://api.photonx.network

# Contract Addresses (Mainnet)
NEXT_PUBLIC_SETTLEMENT_CONTRACT=0x...
NEXT_PUBLIC_CUSTODY_VAULT=0x...

# External Services
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Staging Environment
```env
# Staging Configuration
NODE_ENV=staging
NEXT_PUBLIC_CHAIN_ID=11155111

# Sepolia Testnet
NEXT_PUBLIC_COORDINATOR_URL=https://staging-api.photonx.network
NEXT_PUBLIC_SETTLEMENT_CONTRACT=0x...
```

### Development Environment
```env
# Local Development
NODE_ENV=development
NEXT_PUBLIC_CHAIN_ID=31337

# Local Services
NEXT_PUBLIC_COORDINATOR_URL=http://localhost:3001
NEXT_PUBLIC_SETTLEMENT_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 🐳 Docker Deployment

### Single Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Multi-Container (Full Stack)
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - coordinator
      - mongodb
      - redis

  coordinator:
    build: ./apps/coordinator
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
```

## 🔐 Security Checklist

### Pre-Deployment
- [ ] Remove debug flags
- [ ] Set secure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers

### Post-Deployment
- [ ] Test wallet connections
- [ ] Verify API endpoints
- [ ] Check contract interactions
- [ ] Monitor error rates
- [ ] Set up alerts

## 📊 Monitoring & Analytics

### Error Tracking
```bash
# Sentry Integration
npm install @sentry/nextjs
```

### Performance Monitoring
```bash
# Vercel Analytics
npm install @vercel/analytics
```

### Custom Metrics
```javascript
// Track trading metrics
analytics.track('trade_executed', {
  pair: 'ETH/USDC',
  amount: 1.5,
  gas_saved: 450000
});
```

## 🚀 CI/CD Pipeline

### GitHub Actions
- Automated testing on PR
- Build verification
- Deployment to staging/production
- Contract compilation and testing

### Deployment Triggers
- **Production**: Push to `main` branch
- **Staging**: Push to `develop` branch
- **Preview**: Pull request creation

## 🔄 Rollback Strategy

### Quick Rollback
```bash
# Vercel
vercel rollback [deployment-url]

# Manual
git revert [commit-hash]
git push origin main
```

### Database Migrations
- Always backup before deployment
- Test migrations on staging first
- Have rollback scripts ready

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Multiple app instances
- Database read replicas
- CDN for static assets

### Performance Optimization
- Enable caching headers
- Optimize bundle size
- Use image optimization
- Implement lazy loading

## 🆘 Troubleshooting

### Common Issues
1. **Build Failures**
   - Check Node.js version (18+)
   - Verify environment variables
   - Clear cache and reinstall

2. **Runtime Errors**
   - Check API endpoints
   - Verify contract addresses
   - Monitor network connectivity

3. **Wallet Connection Issues**
   - Ensure HTTPS in production
   - Check network configurations
   - Verify contract deployments

### Debug Commands
```bash
# Check build output
npm run build -- --debug

# Analyze bundle
npm run analyze

# Check dependencies
npm audit
```

## 📞 Support

For deployment issues:
- 📧 Email: deploy@photonx.network
- 💬 Discord: [PhotonX Community](https://discord.gg/photonx)
- 📖 Docs: [docs.photonx.network](https://docs.photonx.network)

---

**Ready to deploy PhotonX to the world! 🌍**