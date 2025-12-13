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
app.use(express.static(path.join(__dirname, 'public')));

// DB Connection Check Middleware
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && !req.path.startsWith('/api/admin')) {
        // Allow admin to potentially see status even if DB down? No, probably better to fail gracefully.
        // But for debugging, let's log it.
        console.error("Database not connected. State:", mongoose.connection.readyState);
    }
    next();
});

// --- Database Setup (MongoDB) ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({
    id: String, // Keep UUID for compatibility
    email: { type: String, unique: true, required: true },
    passwordHash: String,
    machineId: String,
    ip: String,
    // Profile Data
    name: String,
    phone: String,
    avatar: String, // Base64 or URL
    companyLogo: String, // Base64 or URL
    showLogoInPV: { type: Boolean, default: false },

    trialUsed: { type: Boolean, default: false },
    licenseType: { type: String, default: 'none' },
    expires: Date,
    createdAt: { type: Date, default: Date.now }
});

const licenseSchema = new mongoose.Schema({
    token: { type: String, unique: true, required: true },
    payload: {
        id: String,
        days: Number,
        email: String,
        type: String,
        notes: String,
        created: Date
    },
    status: { type: String, default: 'active' }, // active, used, revoked
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const License = mongoose.model('License', licenseSchema);

// --- API Endpoints ---

app.get('/', (req, res) => {
    res.json({ message: 'Sniper Backend is running', status: 'OK' });
});

// 1. Register Machine
app.post('/api/register-machine', async (req, res) => {
    const { email, passwordHash, machineId, ip } = req.body;

    if (!email || !machineId) {
        return res.status(400).json({ error: 'Email and Machine ID are required' });
    }

    try {
        let user = await User.findOne({ email });

        if (user) {
            // Update existing user info
            user.machineId = machineId;
            user.ip = ip || user.ip;
            user.passwordHash = passwordHash || user.passwordHash;
            await user.save();
            return res.json({ message: 'User updated', user });
        }

        // Create new user
        user = new User({
            id: uuidv4(),
            email,
            passwordHash,
            machineId,
            ip,
            trialUsed: false,
            licenseType: 'none',
            expires: null
        });

        await user.save();
        res.json({ message: 'User registered', user });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Activate Trial
app.post('/api/activate-trial', async (req, res) => {
    const { email, machineId, days = 7 } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if trial already used by email
        if (user.trialUsed) {
            return res.status(403).json({ error: 'Trial already used for this account' });
        }

        // Check if machineId has used trial (anti-fraud)
        const machineUsed = await User.findOne({ machineId, trialUsed: true, email: { $ne: email } });
        if (machineUsed) {
            return res.status(403).json({ error: 'Trial already used on this machine' });
        }

        // Activate Trial
        const expires = new Date();
        expires.setDate(expires.getDate() + days);

        user.trialUsed = true;
        user.licenseType = 'trial';
        user.expires = expires;

        await user.save();
        res.json({ message: 'Trial activated', expires: user.expires });
    } catch (error) {
        console.error("Trial error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Generate License (Admin)
app.post('/api/generate-license', async (req, res) => {
    const { days, email, type = 'custom' } = req.body;

    const payload = {
        id: uuidv4(),
        days,
        email,
        type,
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
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error generating license' });
    }
});

// 4. Validate License
app.post('/api/validate-license', async (req, res) => {
    const { token, machineId, email } = req.body;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // Check if revoked
        const licenseRecord = await License.findOne({ token });
        if (licenseRecord && licenseRecord.status === 'revoked') {
            return res.status(403).json({ error: 'License revoked' });
        }

        // Calculate expiration
        const created = new Date(decoded.created);
        const expires = new Date(created);
        expires.setDate(expires.getDate() + decoded.days);

        if (new Date() > expires) {
            return res.status(403).json({ error: 'License expired' });
        }

        // Optional: Bind to user if not already
        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                user.licenseType = decoded.type || 'paid';
                user.expires = expires;
                await user.save();
            }
        }

        res.json({ valid: true, expires: expires.toISOString(), type: decoded.type });

    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// 5. Save User Profile
app.post('/api/user-profile/save', async (req, res) => {
    const { email, name, phone, avatar, companyLogo, showLogoInPV, machineId } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        let user = await User.findOne({ email });

        if (user) {
            user.name = name || user.name;
            user.phone = phone || user.phone;
            user.avatar = avatar || user.avatar;
            user.companyLogo = companyLogo || user.companyLogo;
            if (showLogoInPV !== undefined) user.showLogoInPV = showLogoInPV;
            if (machineId) user.machineId = machineId; // Update machine ID if provided

            await user.save();
            return res.json({ success: true, message: 'Profile updated', user });
        } else {
            // Create new user if not exists (auto-register)
            user = new User({
                id: uuidv4(),
                email,
                name,
                phone,
                avatar,
                companyLogo,
                showLogoInPV,
                machineId,
                licenseType: 'none'
            });
            await user.save();
            return res.json({ success: true, message: 'Profile created', user });
        }
    } catch (error) {
        console.error("Save profile error:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
