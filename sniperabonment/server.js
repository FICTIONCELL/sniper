import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key';
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(path.join(__dirname, 'public')));

// Security Headers Middleware (CSP, COOP, COEP)
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");

    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://sniper-rptn.onrender.com https://thesniper.onrender.com; " +
        "frame-src https://accounts.google.com; " +
        "img-src 'self' data: https://lh3.googleusercontent.com; " +
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com"
    );
    next();
});

// DB Connection Check Middleware
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && !req.path.startsWith('/api/admin')) {
        console.error("Database not connected. State:", mongoose.connection.readyState);
    }
    next();
});

// ... (Database Setup and Schemas remain unchanged)

// 5. Save User Profile (Strict License Data Only)
app.post('/api/user-profile/save', async (req, res) => {
    try {
        const { email, subscriptionStatus, licenseKey, licenseEnd } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        await User.updateOne(
            { email },
            {
                email,
                subscriptionStatus: subscriptionStatus || "free",
                licenseKey: licenseKey || null,
                licenseEnd: licenseEnd || null
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error("MongoDB SAVE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// 6. Get User Profile
app.get('/api/user-profile/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Construct profile object matching frontend interface
        const profile = {
            name: user.name || '',
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            companyLogo: user.companyLogo || '',
            showLogoInPV: user.showLogoInPV || false,
            subscriptionStatus: user.licenseType === 'none' ? 'inactive' : 'active', // Simplified logic
            subscriptionPlan: user.licenseType,
            subscriptionStartDate: user.createdAt, // Approx
            subscriptionExpiryDate: user.expires,
            machineId: user.machineId,
            lastUpdated: new Date().toISOString()
        };

        res.json({ success: true, profile });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// --- Admin Auth Middleware ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
console.log("Admin Password configured:", ADMIN_PASSWORD); // Temporary log for debugging

const adminAuth = (req, res, next) => {
    const pwd = req.headers['x-admin-password'];
    if (pwd === ADMIN_PASSWORD) {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- Admin API Endpoints ---

app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const totalLicenses = await License.countDocuments();
        const activeLicenses = await License.countDocuments({ status: 'active' });
        const revokedLicenses = await License.countDocuments({ status: 'revoked' });
        const totalTrials = await User.countDocuments({ trialUsed: true });
        const activeSubscriptions = await User.countDocuments({
            licenseType: { $nin: ['none', 'revoked'] }
        });

        const stats = {
            totalLicenses,
            activeLicenses,
            usedLicenses: 0, // Logic TBD
            revokedLicenses,
            totalTrials,
            activeSubscriptions
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

app.get('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
        const licenses = await License.find().sort({ createdAt: -1 });
        const mapped = licenses.map(l => ({
            id: l.token,
            key: l.token,
            plan: l.payload.type,
            status: l.status,
            created_at: l.createdAt,
            expires_at: null,
            email: l.payload.email,
            notes: l.payload.notes
        }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching licenses' });
    }
});

app.post('/api/admin/licenses', adminAuth, async (req, res) => {
    const { plan, notes } = req.body;
    const days = plan === 'yearly' ? 365 : plan === 'monthly' ? 30 : 7;

    const payload = {
        id: uuidv4(),
        days,
        type: plan,
        notes,
        created: new Date()
    };
    const token = jwt.sign(payload, SECRET_KEY);

    try {
        const newLicense = new License({
            token,
            payload,
            status: 'active'
        });
        await newLicense.save();

        res.json({
            license: {
                key: token,
                plan,
                status: 'active'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating license' });
    }
});

app.get('/api/admin/trials', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ trialUsed: true }).sort({ createdAt: -1 });
        const trials = users.map(u => ({
            id: u.id,
            machine_id: u.machineId,
            email: u.email,
            device_name: "Unknown",
            started_at: u.createdAt,
            expired_at: u.expires
        }));
        res.json(trials);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching trials' });
    }
});

app.get('/api/admin/subscriptions', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ licenseType: { $ne: 'none' } }).sort({ createdAt: -1 });
        const subs = users.map(u => ({
            id: u.id,
            machine_id: u.machineId,
            email: u.email,
            plan: u.licenseType,
            status: 'active',
            started_at: u.createdAt,
            expires_at: u.expires
        }));
        res.json(subs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching subscriptions' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Revoke License/User
app.post('/api/revoke', async (req, res) => {
    const { email, token } = req.body;

    try {
        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                user.licenseType = 'revoked';
                user.expires = new Date();
                await user.save();
                return res.json({ message: `User ${email} revoked` });
            }
        }

        if (token) {
            const license = await License.findOne({ token });
            if (license) {
                license.status = 'revoked';
                await license.save();
                return res.json({ message: 'License revoked' });
            }
        }
        res.status(404).json({ error: 'User or License not found' });
    } catch (error) {
        res.status(500).json({ error: 'Error revoking' });
    }
});

app.put('/api/admin/licenses/:id/revoke', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const license = await License.findOne({ token: id });
        if (license) {
            license.status = 'revoked';
            await license.save();
            return res.json({ message: 'License revoked' });
        }
        res.status(404).json({ error: 'License not found' });
    } catch (error) {
        res.status(500).json({ error: 'Error revoking license' });
    }
});

app.delete('/api/admin/licenses/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await License.deleteOne({ token: id });
        if (result.deletedCount > 0) {
            return res.json({ message: 'License deleted' });
        }
        res.status(404).json({ error: 'License not found' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting license' });
    }
});

// --- Serve React Frontend ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// NOTE: Express 5 requires (.*) instead of * for wildcard
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
