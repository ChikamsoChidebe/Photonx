@echo off
echo Starting PhotonX Development Environment...

echo.
echo 1. Starting Docker services...
docker-compose -f docker-compose.simple.yml up -d

echo.
echo 2. Waiting for services to be ready...
timeout /t 10

echo.
echo 3. Installing dependencies...
cd packages\proto
call npm install
call npm run build
cd ..\..

cd apps\coordinator
call npm install
cd ..\..

cd apps\web
call npm install
cd ..\..

cd contracts
call npm install

echo.
echo 4. Deploying contracts...
call npx hardhat node --hostname 0.0.0.0 --port 8545 &
timeout /t 5
call npx hardhat run scripts\deploy.ts --network localhost

echo.
echo PhotonX is ready!
echo - Web App: http://localhost:3000
echo - Coordinator: http://localhost:3001
echo - Blockchain: http://localhost:8545
echo.
pause