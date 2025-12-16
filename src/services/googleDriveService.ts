import axios from 'axios';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DB_FILE_NAME = 'sniper_build_flow_db.json';

export const googleDriveService = {
    // Helper to find a file in appDataFolder by name
    async findFileInAppData(accessToken: string, fileName: string) {
        try {
            const response = await axios.get(DRIVE_API_URL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    q: `name = '${fileName}' and 'appDataFolder' in parents and trashed = false`,
                    spaces: 'appDataFolder',
                    fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
                },
            });
            return response.data.files[0]; // Returns undefined if not found
        } catch (error) {
            console.error(`Error finding file ${fileName} in AppData:`, error);
            throw error;
        }
    },

    async findFile(accessToken: string) {
        return this.findFileInAppData(accessToken, DB_FILE_NAME);
    },

    async createFile(accessToken: string, data: any) {
        try {
            const fileMetadata = {
                name: DB_FILE_NAME,
                mimeType: 'application/json',
                parents: ['appDataFolder'],
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

            const response = await axios.post(`${UPLOAD_API_URL}?uploadType=multipart`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating file in AppData:', error);
            throw error;
        }
    },

    async updateFile(accessToken: string, fileId: string, data: any) {
        try {
            const response = await axios.patch(`${UPLOAD_API_URL}/${fileId}?uploadType=media`, JSON.stringify(data), {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating file in AppData:', error);
            throw error;
        }
    },

    async readFile(accessToken: string, fileId: string) {
        try {
            const response = await axios.get(`${DRIVE_API_URL}/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    alt: 'media',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error reading file from AppData:', error);
            throw error;
        }
    },

    // Upload any file to AppData folder
    async uploadFile(accessToken: string, file: File | Blob, fileName: string, description?: string) {
        try {
            const fileMetadata = {
                name: fileName,
                parents: ['appDataFolder'],
                description: description
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            formData.append('file', file);

            const response = await axios.post(`${UPLOAD_API_URL}?uploadType=multipart`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading file to AppData:', error);
            throw error;
        }
    },

    // List all files in AppData folder
    async listFiles(accessToken: string) {
        try {
            const response = await axios.get(DRIVE_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `'appDataFolder' in parents and trashed = false`,
                    spaces: 'appDataFolder',
                    fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime, description)',
                    orderBy: 'createdTime desc'
                },
            });
            return response.data.files;
        } catch (error) {
            console.error('Error listing files in AppData:', error);
            throw error;
        }
    },

    async saveUserProfile(accessToken: string, machineId: string, profileData: any) {
        try {
            const fileName = `${machineId}_abonment.json`;
            const existingFile = await this.findFileInAppData(accessToken, fileName);

            if (existingFile) {
                // Update existing file
                const response = await axios.patch(
                    `${UPLOAD_API_URL}/${existingFile.id}?uploadType=media`,
                    JSON.stringify(profileData),
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                return response.data;
            } else {
                // Create new file
                const fileMetadata = {
                    name: fileName,
                    mimeType: 'application/json',
                    parents: ['appDataFolder'],
                };

                const formData = new FormData();
                formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
                formData.append('file', new Blob([JSON.stringify(profileData)], { type: 'application/json' }));

                const response = await axios.post(`${UPLOAD_API_URL}?uploadType=multipart`, formData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                return response.data;
            }
        } catch (error) {
            console.error('Error saving user profile to AppData:', error);
            throw error;
        }
    },

    async loadUserProfile(accessToken: string, machineId: string) {
        try {
            const fileName = `${machineId}_abonment.json`;
            const file = await this.findFileInAppData(accessToken, fileName);

            if (!file) {
                return null;
            }

            // Read file content
            const contentResponse = await axios.get(`${DRIVE_API_URL}/${file.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { alt: 'media' },
            });

            return contentResponse.data;
        } catch (error) {
            console.error('Error loading user profile from AppData:', error);
            return null;
        }
    },
};
