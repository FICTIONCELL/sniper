import axios from 'axios';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DB_FILE_NAME = 'sniper_build_flow_db.json';
const FOLDER_NAME = 'sniper_database';

export const googleDriveService = {
    async ensureFolder(accessToken: string) {
        try {
            // Check if folder exists
            const response = await axios.get(DRIVE_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`,
                    spaces: 'drive',
                },
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0];
            }

            // Create folder if it doesn't exist
            const fileMetadata = {
                name: FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            };

            const createResponse = await axios.post(DRIVE_API_URL, fileMetadata, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return createResponse.data;
        } catch (error) {
            console.error('Error ensuring folder exists:', error);
            throw error;
        }
    },

    async findFile(accessToken: string) {
        try {
            // First ensure folder exists
            const folder = await this.ensureFolder(accessToken);

            const response = await axios.get(DRIVE_API_URL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    q: `name = '${DB_FILE_NAME}' and '${folder.id}' in parents and trashed = false`,
                    spaces: 'drive',
                },
            });
            return response.data.files[0]; // Returns undefined if not found
        } catch (error) {
            console.error('Error finding file in Drive:', error);
            throw error;
        }
    },

    async createFile(accessToken: string, data: any) {
        try {
            // First ensure folder exists
            const folder = await this.ensureFolder(accessToken);

            const fileMetadata = {
                name: DB_FILE_NAME,
                mimeType: 'application/json',
                parents: [folder.id],
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
            console.error('Error creating file in Drive:', error);
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
            console.error('Error updating file in Drive:', error);
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
            console.error('Error reading file from Drive:', error);
            throw error;
        }
    },

    async findFolder(accessToken: string, folderName: string) {
        try {
            const response = await axios.get(DRIVE_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
                    spaces: 'drive',
                },
            });
            return response.data.files[0];
        } catch (error) {
            console.error('Error finding folder:', error);
            throw error;
        }
    },

    async createFolder(accessToken: string, folderName: string) {
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };

            const response = await axios.post(DRIVE_API_URL, fileMetadata, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    },

    async uploadFile(accessToken: string, file: File | Blob, fileName: string, folderId: string, description?: string) {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [folderId],
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
            console.error('Error uploading file:', error);
            throw error;
        }
    },

    async listFiles(accessToken: string, folderId: string) {
        try {
            const response = await axios.get(DRIVE_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `'${folderId}' in parents and trashed = false`,
                    fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime, description)',
                    orderBy: 'createdTime desc'
                },
            });
            return response.data.files;
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    },

    async saveUserProfile(accessToken: string, machineId: string, profileData: any) {
        try {
            // Ensure folder exists
            const folder = await this.ensureFolder(accessToken);

            const fileName = `${machineId}_abonment.json`;

            // Check if file already exists
            const existingFileResponse = await axios.get(DRIVE_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `name = '${fileName}' and '${folder.id}' in parents and trashed = false`,
                    spaces: 'drive',
                },
            });

            const existingFile = existingFileResponse.data.files[0];

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
                    parents: [folder.id],
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
            console.error('Error saving user profile to Drive:', error);
            throw error;
        }
    },

    async loadUserProfile(accessToken: string, machineId: string) {
        try {
            // Ensure folder exists
            const folder = await this.ensureFolder(accessToken);

            const fileName = `${machineId}_abonment.json`;

            // Find the file
            const response = await axios.get(DRIVE_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `name = '${fileName}' and '${folder.id}' in parents and trashed = false`,
                    spaces: 'drive',
                },
            });

            const file = response.data.files[0];
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
            console.error('Error loading user profile from Drive:', error);
            return null;
        }
    },
};
