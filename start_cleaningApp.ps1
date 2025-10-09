# Ouvre un terminal pour le backend (npm run dev)
Start-Process powershell -ArgumentList "cd 'C:\Dev\Velya'; npm run dev"

# Ouvre un terminal pour le frontend (npm start)
Start-Process powershell -ArgumentList "cd 'C:\Dev\Velya\frontend'; npm start"

# Ouvre un terminal pour MongoDB
Start-Process powershell -ArgumentList "C:\MongoDB\bin\mongod.exe"

