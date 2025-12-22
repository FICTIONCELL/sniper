import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'sniper-secret-key-2024';
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password']
}));
app.use(bodyParser.json());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Security Headers Middleware (CSP, COOP, COEP)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");

    res.setHeader(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://sniper-rptn.onrender.com http://localhost:5000",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'"
        ].join("; ")
    );

    if (mongoose.connection.readyState !== 1) {
        console.error("Database not connected. State:", mongoose.connection.readyState);
    }
    next();
});

// MongoDB Connection
if (!MONGODB_URI) {
    console.error('❌ CRITICAL: MONGODB_URI is not defined in environment variables!');
} else {
    console.log('Attempting to connect to MongoDB...');
}

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
});

// MongoDB Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: String,
    machineId: String,
    ip: String,
    licenseType: { type: String, default: 'none' },
    expires: Date,
    trialUsed: { type: Boolean, default: false },
    trialDate: Date,
    currentLicense: String,
    licenseHistory: [String],
    createdAt: { type: Date, default: Date.now },
    name: String,
    phone: String,
    avatar: String,
    companyLogo: String,
    showLogoInPV: Boolean,
    subscriptionStatus: String,
    licenseKey: String,
    licenseEnd: Date
});

const licenseSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    email: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['trial', 'monthly', '6months', 'yearly', 'lifetime'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'revoked', 'expired'],
        default: 'active'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    daysRemaining: Number,
    notes: String,
    token: String, // legacy field
    payload: Object, // legacy field
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

licenseSchema.virtual('calculatedDaysRemaining').get(function () {
    if (this.type === 'lifetime') return -1;
    if (!this.endDate) return 0;
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

licenseSchema.pre('save', function () {
    if (!this.startDate) {
        this.startDate = new Date();
    }

    if (this.type === 'lifetime') {
        this.daysRemaining = -1;
        this.endDate = null;
    } else {
        const durations = {
            'trial': 30,
            'monthly': 30,
            '6months': 180,
            'yearly': 365
        };
        const duration = durations[this.type] || 30;
        if (!this.endDate) {
            this.endDate = new Date(this.startDate.getTime() + duration * 24 * 60 * 60 * 1000);
        }

        const now = new Date();
        const end = new Date(this.endDate);
        const diffTime = end - now;
        this.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (this.daysRemaining < 0) {
            this.daysRemaining = 0;
            if (this.status === 'active') {
                this.status = 'expired';
            }
        }
    }
    this.updatedAt = new Date();
});

const User = mongoose.model('User', userSchema);
const License = mongoose.model('License', licenseSchema);

// --- Admin Auth Middleware ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '127.0.0.1';

const adminAuth = (req, res, next) => {
    const rawPwd = req.headers['x-admin-password'] || req.query.password || '';
    const pwd = rawPwd.trim();

    if (pwd === ADMIN_PASSWORD.trim()) {
        if (mongoose.connection.readyState !== 1) {
            const state = mongoose.connection.readyState;
            const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
            return res.status(503).json({
                error: 'Database not connected',
                details: `Current state: ${states[state] || state}. Check MONGODB_URI and IP whitelist.`
            });
        }
        next();
    } else {
        console.warn(`[AdminAuth] Authentication failed for ${req.path}. Expected length: ${ADMIN_PASSWORD.trim().length}, Received length: ${pwd.length}`);
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- API Endpoints ---

app.post('/api/user-profile/save', async (req, res) => {
    try {
        const { email, subscriptionStatus, licenseKey, licenseEnd, name, phone, avatar, companyLogo, showLogoInPV } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        await User.updateOne(
            { email: email.toLowerCase() },
            {
                $set: {
                    name, phone, avatar, companyLogo, showLogoInPV,
                    subscriptionStatus, licenseKey, licenseEnd,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error("MongoDB SAVE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user-profile/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, profile: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/api/trial/start', async (req, res) => {
    try {
        const { email, machineId, deviceName } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        const normalizedEmail = email.toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });
        if (user && user.trialUsed) {
            return res.status(400).json({ error: 'Trial already used' });
        }

        const duration = 30;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
        const key = `TRIAL-${uuidv4().substring(0, 8).toUpperCase()}`;

        const newLicense = new License({
            key, email: normalizedEmail, type: 'trial', status: 'active',
            startDate, endDate, daysRemaining: duration,
            notes: `Trial for ${deviceName || 'unknown'}`
        });
        await newLicense.save();

        await User.updateOne(
            { email: normalizedEmail },
            { trialUsed: true, trialDate: startDate, currentLicense: key, licenseType: 'trial', expires: endDate },
            { upsert: true }
        );

        res.json({ success: true, licenseKey: key, expires: endDate });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/validate-license', async (req, res) => {
    try {
        const { token, email } = req.body;
        const license = await License.findOne({ key: token, email: email.toLowerCase() });
        if (!license) return res.status(404).json({ valid: false, error: 'Invalid license' });

        if (license.status !== 'active') return res.json({ valid: false, status: license.status });

        if (license.endDate && new Date() > new Date(license.endDate)) {
            license.status = 'expired';
            await license.save();
            return res.json({ valid: false, status: 'expired' });
        }

        res.json({ valid: true, type: license.type, expires: license.endDate, daysRemaining: license.daysRemaining });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin Endpoints
app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const stats = {
            totalLicenses: await License.countDocuments(),
            activeLicenses: await License.countDocuments({ status: 'active' }),
            totalUsers: await User.countDocuments()
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

app.get('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
        const licenses = await License.find().sort({ createdAt: -1 });
        res.json(licenses.map(l => ({
            id: l._id, key: l.key, email: l.email, type: l.type, status: l.status,
            startDate: l.startDate, endDate: l.endDate, daysRemaining: l.daysRemaining,
            notes: l.notes, createdAt: l.createdAt
        })));
    } catch (error) {
        res.status(500).json({ error: 'Error fetching licenses' });
    }
});

app.post('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
        const { email, type, notes } = req.body;
        const key = `SNIPER-${uuidv4().substring(0, 8).toUpperCase()}`;
        const license = new License({ key, email: email.toLowerCase(), type, notes });
        await license.save();
        res.json({ success: true, license });
    } catch (error) {
        res.status(500).json({ error: 'Error creating license' });
    }
});

app.get('/api/admin/export/csv', adminAuth, async (req, res) => {
    try {
        const licenses = await License.find().sort({ createdAt: -1 });

        // CSV Header
        const csvHeader = 'License Key,Email,Type,Status,Start Date,End Date,Days Remaining,Notes\n';

        // CSV Rows
        const csvRows = licenses.map(l => {
            const startDate = l.startDate ? new Date(l.startDate).toISOString().split('T')[0] : '';
            const endDate = l.endDate ? new Date(l.endDate).toISOString().split('T')[0] : (l.type === 'lifetime' ? 'Unlimited' : '');
            const daysRemaining = l.type === 'lifetime' ? 'Unlimited' : (l.daysRemaining || 0);
            const notes = (l.notes || '').replace(/,/g, ';'); // Replace commas to avoid CSV breakage

            return `${l.key},${l.email},${l.type},${l.status},${startDate},${endDate},${daysRemaining},"${notes}"`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=licenses_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvHeader + csvRows);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ error: 'Error exporting CSV' });
    }
});

app.put('/api/admin/licenses/:id/revoke', adminAuth, async (req, res) => {
    try {
        await License.findByIdAndUpdate(req.params.id, { status: 'revoked' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error revoking' });
    }
});

app.delete('/api/admin/licenses/:id', adminAuth, async (req, res) => {
    try {
        await License.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/', (req, res) => {
    res.json({ message: "Sniper License API is running" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
