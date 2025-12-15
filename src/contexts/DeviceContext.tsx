import React, { createContext, useContext, useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';
import { useLocalStorage, generateId } from '@/hooks/useLocalStorage';

export interface DeviceInfo {
    deviceId: string;
    brand: string;
    model: string;
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    appVersion: string;
    lastActive: string;
    isCurrent: boolean;
}

interface DeviceContextType {
    currentDevice: DeviceInfo | null;
    devices: DeviceInfo[];
    removeDevice: (deviceId: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [devices, setDevices] = useLocalStorage<DeviceInfo[]>('sniper_devices', []);
    const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);

    useEffect(() => {
        // Initialize current device info
        let deviceId = localStorage.getItem('sniper_device_id');
        if (!deviceId) {
            deviceId = generateId();
            localStorage.setItem('sniper_device_id', deviceId);
        }

        const parser = new UAParser();
        const result = parser.getResult();
        const appVersion = "1.0.0"; // Should ideally come from package.json or config

        const deviceInfo: DeviceInfo = {
            deviceId: deviceId!,
            brand: result.device.vendor || 'Unknown',
            model: result.device.model || 'Desktop',
            os: result.os.name || 'Unknown',
            osVersion: result.os.version || '',
            browser: result.browser.name || 'Unknown',
            browserVersion: result.browser.version || '',
            appVersion: appVersion,
            lastActive: new Date().toISOString(),
            isCurrent: true
        };

        setCurrentDevice(deviceInfo);

        // Update devices list
        setDevices(prevDevices => {
            const otherDevices = prevDevices.filter(d => d.deviceId !== deviceId);
            return [...otherDevices, { ...deviceInfo, isCurrent: false }];
        });

    }, []);

    const removeDevice = (deviceId: string) => {
        setDevices(prev => prev.filter(d => d.deviceId !== deviceId));
    };

    // Enhance devices list with isCurrent flag for consumption
    const exposedDevices = devices.map(d => ({
        ...d,
        isCurrent: d.deviceId === currentDevice?.deviceId
    })).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    return (
        <DeviceContext.Provider value={{ currentDevice, devices: exposedDevices, removeDevice }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => {
    const context = useContext(DeviceContext);
    if (context === undefined) {
        throw new Error('useDevice must be used within a DeviceProvider');
    }
    return context;
};
