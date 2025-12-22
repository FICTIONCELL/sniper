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
app.use(cors({
    origin: [
        "https://thesniper.onrender.com",
        "http://localhost:8080",
        "http://localhost:5173"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-password", "Authorization"]
}));
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
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com",
            "frame-src 'self' https://accounts.google.com https://content.googleapis.com https://idp.google.com",
            "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://idp.google.com https://sniper-rptn.onrender.com https://thesniper.onrender.com",
            "img-src 'self' data: https://lh3.googleusercontent.com",
            "style-src 'self' 'unsafe-inline'"
        ].join("; ")
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

// MongoDB Connection
if (!MONGODB_URI) {
    console.error('❌ CRITICAL: MONGODB_URI is not defined in environment variables!');
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected successfully');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Please check if your MONGODB_URI is correct and your IP is whitelisted in MongoDB Atlas.');
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
    currentLicense: String, // Reference to active license key
    licenseHistory: [String], // Array of all license keys used
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
        default: 'active',
        index: true
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    daysRemaining: Number,
    notes: String,
    createdBy: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Legacy fields for backward compatibility
    token: String,
    payload: Object
});

// Virtual field to calculate days remaining
licenseSchema.virtual('calculatedDaysRemaining').get(function () {
    if (this.type === 'lifetime') return -1; // -1 means unlimited
    if (!this.endDate) return 0;
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

// Update daysRemaining before saving
licenseSchema.pre('save', function (next) {
    if (this.type === 'lifetime') {
        this.daysRemaining = -1;
        this.endDate = null;
    } else if (this.endDate) {
        const now = new Date();
        const end = new Date(this.endDate);
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        this.daysRemaining = diffDays > 0 ? diffDays : 0;

        // Auto-expire if days remaining is 0
        if (this.daysRemaining === 0 && this.status === 'active') {
            this.status = 'expired';
        }
    }
    this.updatedAt = new Date();
    next();
});

const User = mongoose.model('User', userSchema);
const License = mongoose.model('License', licenseSchema);

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

// 7. Start Free Trial
app.post('/api/trial/start', async (req, res) => {
    try {
        const { email, machineId, deviceName } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user already used a trial
        let user = await User.findOne({ email });
        if (user && user.trialUsed) {
            return res.status(400).json({
                error: 'Trial already used for this email',
                trialDate: user.trialDate
            });
        }

        // Create a 30-day trial license
        const duration = 30;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

        const key = jwt.sign({
            id: uuidv4(),
            email,
            type: 'trial',
            created: startDate
        }, SECRET_KEY);

        const newLicense = new License({
            key,
            email,
            type: 'trial',
            status: 'active',
            startDate,
            endDate,
            daysRemaining: duration,
            notes: `Auto-generated trial for ${deviceName || 'unknown device'}`,
            token: key, // for backward compatibility
            payload: { email, type: 'trial', machineId }
        });

        await newLicense.save();

        // Update user
        await User.updateOne(
            { email },
            {
                trialUsed: true,
                trialDate: startDate,
                currentLicense: key,
                machineId: machineId || user?.machineId,
                $push: { licenseHistory: key }
            },
            { upsert: true }
        );

        res.json({
            success: true,
            expires: endDate.toISOString(),
            licenseKey: key
        });
    } catch (error) {
        console.error('Start trial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 7.5 Check Trial Availability
app.get('/api/trial/check/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });

        if (user && user.trialUsed) {
            return res.json({
                canStartTrial: false,
                previousTrial: {
                    started_at: user.trialDate,
                    expired_at: user.expires // Assuming expires was set during trial
                }
            });
        }

        res.json({ canStartTrial: true });
    } catch (error) {
        console.error('Check trial error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 8. Validate License
app.post('/api/validate-license', async (req, res) => {
    try {
        const { token, email, machineId } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'License key (token) is required' });
        }

        // Find license by key or token
        const license = await License.findOne({
            $or: [{ key: token }, { token: token }]
        });

        if (!license) {
            return res.status(404).json({ valid: false, error: 'License not found' });
        }

        // Check status
        if (license.status !== 'active') {
            return res.json({
                valid: false,
                status: license.status,
                error: `License is ${license.status}`
            });
        }

        // Check expiration
        if (license.endDate && new Date() > new Date(license.endDate)) {
            license.status = 'expired';
            await license.save();
            return res.json({ valid: false, status: 'expired', error: 'License has expired' });
        }

        // Optional: Verify email if provided
        if (email && license.email && license.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({ valid: false, error: 'License email mismatch' });
        }

        res.json({
            valid: true,
            type: license.type,
            expires: license.endDate ? license.endDate.toISOString() : null,
            daysRemaining: license.daysRemaining
        });
    } catch (error) {
        console.error('Validate license error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Admin Auth Middleware ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '127.0.0.1';
console.log("Admin Password configured:", ADMIN_PASSWORD); // Temporary log for debugging

const adminAuth = (req, res, next) => {
    const pwd = req.headers['x-admin-password'];
    if (pwd === ADMIN_PASSWORD) {
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
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: state === 1 ? 'ok' : 'error',
        database: states[state] || state,
        mongodb_uri_set: !!process.env.MONGODB_URI,
        time: new Date().toISOString()
    });
});

// --- Admin API Endpoints ---

// Helper function to calculate license duration in days
const getLicenseDuration = (type) => {
    switch (type) {
        case 'trial': return 30;
        case 'monthly': return 30;
        case '6months': return 180;
        case 'yearly': return 365;
        case 'lifetime': return -1; // unlimited
        default: return 30;
    }
};

// GET /api/admin/stats - Detailed statistics
app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const totalLicenses = await License.countDocuments();
        const activeLicenses = await License.countDocuments({ status: 'active' });
        const suspendedLicenses = await License.countDocuments({ status: 'suspended' });
        const revokedLicenses = await License.countDocuments({ status: 'revoked' });
        const expiredLicenses = await License.countDocuments({ status: 'expired' });

        const trialLicenses = await License.countDocuments({ type: 'trial' });
        const monthlyLicenses = await License.countDocuments({ type: 'monthly' });
        const sixMonthsLicenses = await License.countDocuments({ type: '6months' });
        const yearlyLicenses = await License.countDocuments({ type: 'yearly' });
        const lifetimeLicenses = await License.countDocuments({ type: 'lifetime' });

        const totalTrials = await User.countDocuments({ trialUsed: true });
        const totalUsers = await User.countDocuments();

        const stats = {
            totalLicenses,
            activeLicenses,
            suspendedLicenses,
            revokedLicenses,
            expiredLicenses,
            totalTrials,
            totalUsers,
            byType: {
                trial: trialLicenses,
                monthly: monthlyLicenses,
                sixMonths: sixMonthsLicenses,
                yearly: yearlyLicenses,
                lifetime: lifetimeLicenses
            }
        };
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

// GET /api/admin/licenses - List all licenses with optional filters
app.get('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
        const { email, type, status, search } = req.query;

        let query = {};

        if (email) query.email = new RegExp(email, 'i');
        if (type) query.type = type;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { email: new RegExp(search, 'i') },
                { key: new RegExp(search, 'i') },
                { notes: new RegExp(search, 'i') }
            ];
        }

        const licenses = await License.find(query).sort({ createdAt: -1 });

        const mapped = licenses.map(l => ({
            id: l._id,
            key: l.key || l.token,
            email: l.email,
            type: l.type,
            status: l.status,
            startDate: l.startDate,
            endDate: l.endDate,
            daysRemaining: l.daysRemaining,
            notes: l.notes,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt
        }));

        res.json(mapped);
    } catch (error) {
        console.error('List licenses error:', error);
        res.status(500).json({ error: 'Error fetching licenses' });
    }
});

// POST /api/admin/licenses - Generate a new license
app.post('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
        const { email, type, notes } = req.body;

        if (!email || !type) {
            return res.status(400).json({ error: 'Email and type are required' });
        }

        // Check if trial already used for this email
        if (type === 'trial') {
            const user = await User.findOne({ email });
            if (user && user.trialUsed) {
                return res.status(400).json({
                    error: 'Trial already used for this email',
                    trialDate: user.trialDate
                });
            }
        }

        // Calculate end date
        const duration = getLicenseDuration(type);
        const startDate = new Date();
        const endDate = duration === -1 ? null : new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

        // Generate unique key
        const key = jwt.sign({
            id: uuidv4(),
            email,
            type,
            created: startDate
        }, SECRET_KEY);

        // Create license
        const newLicense = new License({
            key,
            email,
            type,
            status: 'active',
            startDate,
            endDate,
            daysRemaining: duration === -1 ? -1 : duration,
            notes,
            // Legacy fields
            token: key,
            payload: { email, type, notes }
        });

        await newLicense.save();

        // Update user if trial
        if (type === 'trial') {
            await User.updateOne(
                { email },
                {
                    trialUsed: true,
                    trialDate: startDate,
                    currentLicense: key,
                    $push: { licenseHistory: key }
                },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            license: {
                id: newLicense._id,
                key: newLicense.key,
                email: newLicense.email,
                type: newLicense.type,
                status: newLicense.status,
                startDate: newLicense.startDate,
                endDate: newLicense.endDate,
                daysRemaining: newLicense.daysRemaining
            }
        });
    } catch (error) {
        console.error('Create license error:', error);
        res.status(500).json({ error: 'Error creating license' });
    }
});

// PUT /api/admin/licenses/:id/suspend - Suspend a license
app.put('/api/admin/licenses/:id/suspend', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const license = await License.findById(id);

        if (!license) {
            return res.status(404).json({ error: 'License not found' });
        }

        license.status = 'suspended';
        await license.save();

        res.json({
            success: true,
            message: 'License suspended',
            license: {
                id: license._id,
                key: license.key,
                status: license.status
            }
        });
    } catch (error) {
        console.error('Suspend license error:', error);
        res.status(500).json({ error: 'Error suspending license' });
    }
});

// PUT /api/admin/licenses/:id/activate - Activate/Reactivate a license
app.put('/api/admin/licenses/:id/activate', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const license = await License.findById(id);

        if (!license) {
            return res.status(404).json({ error: 'License not found' });
        }

        // Check if license is expired
        if (license.endDate && new Date() > new Date(license.endDate)) {
            return res.status(400).json({ error: 'Cannot activate expired license' });
        }

        license.status = 'active';
        await license.save();

        res.json({
            success: true,
            message: 'License activated',
            license: {
                id: license._id,
                key: license.key,
                status: license.status
            }
        });
    } catch (error) {
        console.error('Activate license error:', error);
        res.status(500).json({ error: 'Error activating license' });
    }
});

// GET /api/admin/export/csv - Export all licenses to CSV
app.get('/api/admin/export/csv', adminAuth, async (req, res) => {
    try {
        const licenses = await License.find().sort({ createdAt: -1 });

        // CSV Header
        const csvHeader = 'Email,License Key,Type,Status,Start Date,End Date,Days Remaining,Notes,Created At\n';

        // CSV Rows
        const csvRows = licenses.map(l => {
            const email = l.email || '';
            const key = l.key || l.token || '';
            const type = l.type || '';
            const status = l.status || '';
            const startDate = l.startDate ? new Date(l.startDate).toLocaleDateString() : '';
            const endDate = l.endDate ? new Date(l.endDate).toLocaleDateString() : 'Unlimited';
            const daysRemaining = l.daysRemaining === -1 ? 'Unlimited' : (l.daysRemaining || 0);
            const notes = (l.notes || '').replace(/,/g, ';'); // Replace commas in notes
            const createdAt = new Date(l.createdAt).toLocaleDateString();

            return `${email},${key},${type},${status},${startDate},${endDate},${daysRemaining},${notes},${createdAt}`;
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=licenses_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ error: 'Error exporting CSV' });
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
