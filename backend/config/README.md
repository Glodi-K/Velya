# Configuration Google Calendar

## Étapes pour activer l'intégration Google Calendar

### 1. Créer un projet Google Cloud
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar

### 2. Créer un compte de service
1. Dans Google Cloud Console, allez dans "IAM & Admin" > "Service Accounts"
2. Cliquez sur "Create Service Account"
3. Donnez un nom au compte (ex: "velya-calendar-service")
4. Cliquez sur "Create and Continue"
5. Accordez le rôle "Editor" ou "Calendar API Service Agent"
6. Cliquez sur "Done"

### 3. Générer les clés
1. Cliquez sur le compte de service créé
2. Allez dans l'onglet "Keys"
3. Cliquez sur "Add Key" > "Create new key"
4. Sélectionnez "JSON"
5. Téléchargez le fichier JSON

### 4. Configurer le fichier
1. Remplacez le contenu de `google-service-account.json` par le contenu du fichier téléchargé
2. Assurez-vous que la variable `GOOGLE_APPLICATION_CREDENTIALS` dans `.env` pointe vers ce fichier

### 5. Partager le calendrier
1. Dans Google Calendar, partagez votre calendrier avec l'email du service account
2. Accordez les permissions "Make changes to events"

## Test
Après configuration, les événements seront automatiquement créés dans Google Calendar quand un prestataire accepte une réservation.

## Désactivation
Si vous ne souhaitez pas utiliser Google Calendar, laissez simplement le fichier template tel quel. Le système fonctionnera sans intégration calendrier.