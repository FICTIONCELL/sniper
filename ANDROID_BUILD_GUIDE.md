# Guide de Build Android - Sniper Build Flow

## 🎯 Vue d'Ensemble

Ce guide vous permettra de générer un fichier **APK** prêt à installer sur tous les téléphones Android.

---

## 📋 Prérequis

### 1. Java JDK 17

**Vérifier si installé:**
```powershell
java -version
```

**Si pas installé, télécharger:**
- https://adoptium.net/temurin/releases/
- Choisir: **JDK 17 (LTS)** pour Windows x64

**Après installation, configurez JAVA_HOME:**
```powershell
# Dans PowerShell Admin
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.xx-hotspot", "Machine")
```

### 2. Android Studio (Optionnel mais recommandé)

**Télécharger:**
- https://developer.android.com/studio

**OU utiliser uniquement Android SDK via sdkmanager (ligne de commande)**

---

## 🔨 Générer l'APK

### Méthode 1: Via Android Studio (Recommandé)

1. **Ouvrir le projet Android:**
   ```powershell
   cd "e:/desktop/sniper-build-flow-main (3) - Copy/sniper-build-flow-main"
   npx cap open android
   ```

2. **Dans Android Studio:**
   - Attendez que Gradle sync se termine
   - Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Attendez la compilation (3-5 min)
   - Cliquez sur "locate" dans la notification

3. **APK généré:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Méthode 2: Ligne de Commande (PowerShell)

1. **Build avec Gradle:**
   ```powershell
   cd "e:/desktop/sniper-build-flow-main (3) - Copy/sniper-build-flow-main/android"
   .\gradlew assembleDebug
   ```

2. **APK généré:**
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 🔐 Créer un APK Signé (Release)

### Étape 1: Créer un Keystore

```powershell
keytool -genkey -v -keystore sniper-release-key.keystore -alias sniper -keyalg RSA -keysize 2048 -validity 10000
```

**Remplissez les informations:**
- Password: (choisissez un mot de passe fort)
- Nom: Votre nom
- Organisation: Votre entreprise
- Ville, État, Pays: Vos infos

**Sauvegarder le keystore dans:**
```
android/app/sniper-release-key.keystore
```

### Étape 2: Configurer Gradle

Créer: `android/key.properties`
```properties
storePassword=VOTRE_PASSWORD
keyPassword=VOTRE_PASSWORD
keyAlias=sniper
storeFile=sniper-release-key.keystore
```

### Étape 3: Modifier `android/app/build.gradle`

Ajouter avant `android {`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dans `android { ... }`, ajouter:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Étape 4: Build Release APK

```powershell
cd android
.\gradlew assembleRelease
```

**APK signé généré:**
```
app/build/outputs/apk/release/app-release.apk
```

---

## 📦 Installer l'APK sur Android

### Sur Téléphone Physique:

1. **Activer sources inconnues:**
   - Paramètres → Sécurité
   - Activer "Sources inconnues"
   - OU pour Android 8+: Autoriser pour le navigateur/gestionnaire de fichiers

2. **Transférer APK:**
   - Par câble USB
   - Par email
   - Par Google Drive/Dropbox
   - Par ADB: `adb install app-debug.apk`

3. **Installer:**
   - Ouvrir le fichier APK sur le téléphone
   - Cliquer "Installer"
   - Ouvrir l'application

### Sur Émulateur:

```powershell
# Démarrer émulateur
emulator -avd Pixel_5_API_30

# Installer APK
adb install app-debug.apk
```

---

## 🔄 Workflow Complet

### Pour chaque mise à jour:

1. **Modifier le code React**
2. **Build web:**
   ```powershell
   npm run build
   ```

3. **Sync Capacitor:**
   ```powershell
   npx cap sync android
   ```

4. **Build APK:**
   ```powershell
   cd android
   .\gradlew assembleDebug
   # OU assembleRelease pour version signée
   ```

5. **Installer sur téléphone**

---

## 🐛 Résolution de Problèmes

### Erreur: "JAVA_HOME not set"

```powershell
# Vérifier JAVA_HOME
echo $env:JAVA_HOME

# Si vide, configurer:
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.xx-hotspot"
```

### Erreur: "SDK location not found"

Créer: `android/local.properties`
```properties
sdk.dir=C\:\\Users\\VotreNom\\AppData\\Local\\Android\\Sdk
```

### Build échoue avec Gradle

```powershell
# Nettoyer le build
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### APK trop volumineux

Le fichier `app-debug.apk` sera d'environ **50-80 MB**.  
Le fichier `app-release.apk` sera optimisé à **30-50 MB**.

---

## 📱 Tester l'Application

### Checklist de test:

- [ ] Login avec Google fonctionne
- [ ] Création de projets
- [ ] Scanner QR code
- [ ] Prendre des photos
- [ ] Sync Google Drive
- [ ] Notifications fonctionnent
- [ ] Mode offline
- [ ] Générer PV PDF

---

## 🚀 Publier sur Google Play Store (Optionnel)

### Prérequis:

1. **Compte développeur Google Play** (25€ one-time)
2. **APK signé** (release)
3. **Icônes et screenshots**
4. **Description de l'app**

### Générer AAB (Android App Bundle):

```powershell
cd android
.\gradlew bundleRelease
```

**Fichier:** `app/build/outputs/bundle/release/app-release.aab`

### Upload sur Play Console:

1. https://play.google.com/console
2. Créer nouvelle application
3. Upload AAB
4. Remplir les métadonnées
5. Soumettre pour révision

**Délai d'approbation:** 1-7 jours

---

## 📞 Support

**En cas de problème:**
1. Vérifier les logs: `cd android && .\gradlew assembleDebug --stacktrace`
2. Vérifier Android SDK est installé
3. Vérifier JDK 17 est installé
4. Clean et rebuild: `.\gradlew clean assembleDebug`

**APK fonctionnera sur:**
- Android 7.0+ (API 24+)
- 95% des appareils Android actuels
