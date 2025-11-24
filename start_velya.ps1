```powershell
# Ouvre un terminal pour le backend (npm run dev)
Start-Process powershell -ArgumentList "cd 'C:\Dev\velya-backend-clean'; npm run dev"

# Ouvre un terminal pour le frontend (npm start)
Start-Process powershell -ArgumentList "cd 'C:\Dev\velya-backend-clean\frontend'; npm start"

# Ouvre un terminal pour MongoDB
Start-Process powershell -ArgumentList "C:\MongoDB\bin\mongod.exe --dbpath C:\data\db"

```
Start-Process powershell -ArgumentList "cd 'C:\Dev\velya-backend-clean'; npm run dev"
Start-Process powershell -ArgumentList "cd 'C:\Dev\velya-backend-clean\frontend'; npm start"
