## Instructions pour finaliser l'auto-chargement du profil

### 1. Ajouter l'import dans GoogleDriveContext.tsx

Ligne 3-4, après `import { googleDriveService }`:
```typescript
import { autoLoadProfileOnLogin } from '@/services/profileAutoLoadService';
```

### 2. Appeler autoLoad après le chargement des données

Dans la fonction `loadDataWithToken`, après la ligne 220 (`toast({ title: "💾 Sauvegarde locale..." })`), ajouter:

```typescript
// Auto-load profile based on email
if (userEmail) {
    try {
        await autoLoadProfileOnLogin(token, userEmail);
        toast({
            title: "👤 Profil chargé",
            description: "Votre profil partagé a été appliqué.",
            duration: 2000
        });
    } catch (e) {
        console.log('No shared profile found, using local profile');
    }
}
```

### 3. Mettre à jour Settings.tsx pour utiliser saveProfileByEmail

Dans Settings.tsx, ligne 1 ajouter l'import:
```typescript
import { saveProfileByEmail } from "@/services/profileAutoLoadService";
```

Dans le onClick du bouton (ligne 798), remplacer:
```typescript
// OLD:
if (accessToken) {
    await googleDriveService.saveUserProfile(accessToken, profileData.machineId, profileData);
}

// NEW:
if (accessToken && userEmailForProfile !== 'unknown') {
    await saveProfileByEmail(accessToken, userEmailForProfile, profileData);
}
```

### 4. Vérifier l'email dans GoogleDriveContext

S'assurer que `userEmail` est bien défini dans le context after login.
