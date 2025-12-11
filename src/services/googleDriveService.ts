import axios from 'axios';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DB_FILE_NAME = 'sniper_build_flow_db.json';

export const googleDriveService = {
    async findFile(accessToken: string) {
        try {
            const response = await axios.get(DRIVE_API_URL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    q: `name = '${DB_FILE_NAME}' and trashed = false`,
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
            const fileMetadata = {
                name: DB_FILE_NAME,
                mimeType: 'application/json',
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
};
