import { googleDriveService } from './googleDriveService';
import { UserProfileData } from './mongoDbService';

/**
 * Load user profile from Google Drive by email and apply it to local storage
 */
export async function autoLoadProfileOnLogin(accessToken: string, userEmail: string): Promise<boolean> {
    try {
        console.log(`🔍 Searching for profile: ${userEmail}_profile.json`);

        // Load profile from Google Drive using email
        const profileData = await loadProfileByEmail(accessToken, userEmail);

        if (!profileData) {
            console.log('No profile found for this email');
            return false;
        }

        console.log('✅ Profile found, applying to local storage...');

        // Apply profile to local storage
        const userProfile = {
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            avatar: profileData.avatar || '',
            companyLogo: profileData.companyLogo || '',
            showLogoInPV: profileData.showLogoInPV || false
        };

        localStorage.setItem('sniper_user_profile', JSON.stringify(userProfile));

        console.log('✅ Profile loaded and applied successfully!');
        return true;
    } catch (error) {
        console.error('Error auto-loading profile:', error);
        return false;
    }
}

/**
 * Load profile by email from Google Drive
 */
async function loadProfileByEmail(accessToken: string, userEmail: string): Promise<UserProfileData | null> {
    try {
        const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

        // Ensure folder exists
        const folder = await googleDriveService.ensureFolder(accessToken);

        // Sanitize email for filename
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const fileName = `${sanitizedEmail}_profile.json`;

        // Find the file
        const response = await fetch(`${DRIVE_API_URL}?q=name='${fileName}' and '${folder.id}' in parents and trashed=false`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data = await response.json();
        const file = data.files?.[0];

        if (!file) {
            return null;
        }

        // Read file content
        const contentResponse = await fetch(`${DRIVE_API_URL}/${file.id}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return await contentResponse.json();
    } catch (error) {
        console.error('Error loading profile by email:', error);
        return null;
    }
}

/**
 * Save user profile by email to Google Drive
 */
export async function saveProfileByEmail(
    accessToken: string,
    userEmail: string,
    profileData: UserProfileData
): Promise<void> {
    const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
    const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

    try {
        // Ensure folder exists
        const folder = await googleDriveService.ensureFolder(accessToken);

        // Sanitize email for filename
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
        const fileName = `${sanitizedEmail}_profile.json`;

        // Check if file already exists
        const response = await fetch(`${DRIVE_API_URL}?q=name='${fileName}' and '${folder.id}' in parents and trashed=false`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data = await response.json();
        const existingFile = data.files?.[0];

        if (existingFile) {
            // Update existing file
            await fetch(`${UPLOAD_API_URL}/${existingFile.id}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });
        } else {
            // Create new file
            const fileMetadata = {
                name: fileName,
                mimeType: 'application/json',
                parents: [folder.id],
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            formData.append('file', new Blob([JSON.stringify(profileData)], { type: 'application/json' }));

            await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData
            });
        }

        console.log(`✅ Profile saved as ${fileName}`);
    } catch (error) {
        console.error('Error saving profile by email:', error);
        throw error;
    }
}
