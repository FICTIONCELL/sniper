const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Admin password hash (bcrypt hash of '127.0.0.1')
const ADMIN_PASSWORD_HASH = '$2b$10$FO/GAF04g0XrZCPXwHvpcOgMpDiYvNIz8nyvpXgKxJwUhEhiMrBTC';

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://fictionsell_db_user:MXeurJ6gtP2rT1t7@cluster0.2mpve81.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Schemas
const licenseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    key: { type: String, required: true, unique: true },
    plan: { type: String, required: true },
    status: { type: String, default: 'active' },
    created_at: { type: String, required: true },
    activated_at: String,
    expires_at: String,
    machine_id: String,
    email: String,
    notes: String
});

const usedTrialSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    machine_id: { type: String, required: true },
    email: { type: String, required: true },
    device_name: String,
    started_at: { type: String, required: true },
    expired_at: { type: String, required: true }
});
// Compound index for unique machine_id + email
usedTrialSchema.index({ machine_id: 1, email: 1 }, { unique: true });

const subscriptionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    license_id: String,
    machine_id: { type: String, required: true },
    email: { type: String, required: true },
    plan: { type: String, required: true },
    status: { type: String, default: 'active' },
    started_at: { type: String, required: true },
    expires_at: String
});

const userProfileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    machine_id: { type: String, required: true, unique: true },
    name: String,
    email: String,
    phone: String,
    avatar: String,
    company_logo: String,
    show_logo_in_pv: { type: Boolean, default: false },
    subscription_status: String,
    subscription_plan: String,
    subscription_start_date: String,
    subscription_expiry_date: String,
    last_updated: { type: String, required: true },
    created_at: { type: String, required: true }
});

const License = mongoose.model('License', licenseSchema);
const UsedTrial = mongoose.model('UsedTrial', usedTrialSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Generate License Key
function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
    }
    return segments.join('-');
}

// Admin auth middleware
function adminAuth(req, res, next) {
    const password = req.headers['x-admin-password'];
    if (!password || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// ==================== TRIAL ENDPOINTS ====================

app.post('/api/trial/check', async (req, res) => {
    const { machineId, email } = req.body;
    if (!machineId || !email) return res.status(400).json({ error: 'Machine ID and email required' });

    try {
        const trial = await UsedTrial.findOne({ $or: [{ machine_id: machineId }, { email: email }] });
        res.json({ canStartTrial: !trial, previousTrial: trial || null });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/trial/start', async (req, res) => {
    const { machineId, email, deviceName } = req.body;
    if (!machineId || !email) return res.status(400).json({ error: 'Machine ID and email required' });

    try {
        const existingTrial = await UsedTrial.findOne({ $or: [{ machine_id: machineId }, { email: email }] });
        if (existingTrial) {
            return res.status(403).json({
                error: 'Trial already used',
                message: 'Cet appareil ou email a déjà utilisé la période d\'essai.',
                previousTrial: existingTrial
            });
        }

        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const id = uuidv4();
        await UsedTrial.create({
            id, machine_id: machineId, email, device_name: deviceName || 'Unknown',
            started_at: now.toISOString(), expired_at: expiresAt.toISOString()
        });

        const subId = uuidv4();
        await Subscription.create({
            id: subId, machine_id: machineId, email, plan: 'trial', status: 'active',
            started_at: now.toISOString(), expires_at: expiresAt.toISOString()
        });

        res.json({
            success: true,
            trial: { id, machineId, email, startedAt: now.toISOString(), expiresAt: expiresAt.toISOString() }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start trial', details: error.message });
    }
});

// ==================== LICENSE ENDPOINTS ====================

app.post('/api/license/validate', async (req, res) => {
    const { key, machineId, email } = req.body;
    if (!key) return res.status(400).json({ error: 'License key required' });

    try {
        const license = await License.findOne({ key });
        if (!license) {
            return res.status(404).json({ valid: false, error: 'License not found', message: 'Clé de licence invalide.' });
        }

        if (license.status === 'revoked') {
            return res.status(403).json({ valid: false, error: 'License revoked', message: 'Cette licence a été révoquée.' });
        }

        if (license.status === 'used' && license.machine_id !== machineId) {
            return res.status(403).json({ valid: false, error: 'License already activated on another device', message: 'Cette licence est déjà activée sur un autre appareil.' });
        }

        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return res.status(403).json({ valid: false, error: 'License expired', message: 'Cette licence a expiré.' });
        }

        if (license.status === 'active') {
            const now = new Date();
            let expiresAt = null;

            if (license.plan === 'monthly') {
                expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 1);
            } else if (license.plan === 'yearly') {
                expiresAt = new Date();
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            } else if (license.plan === 'lifetime') {
                expiresAt = new Date();
                expiresAt.setFullYear(expiresAt.getFullYear() + 100);
            }

            license.status = 'used';
            license.activated_at = now.toISOString();
            license.expires_at = expiresAt?.toISOString();
            license.machine_id = machineId;
            license.email = email;
            await license.save();

            const subId = uuidv4();
            await Subscription.create({
                id: subId, license_id: license.id, machine_id: machineId, email, plan: license.plan,
                status: 'active', started_at: now.toISOString(), expires_at: expiresAt?.toISOString()
            });
        }

        res.json({
            valid: true,
            license: {
                id: license.id, key: license.key, plan: license.plan, status: license.status,
                activatedAt: license.activated_at, expiresAt: license.expires_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Validation failed', details: error.message });
    }
});

// ==================== ADMIN ENDPOINTS ====================

app.get('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
        const licenses = await License.find().sort({ created_at: -1 });
        res.json(licenses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch licenses' });
    }
});

app.post('/api/admin/licenses', adminAuth, async (req, res) => {
    const { plan, notes } = req.body;
    if (!plan || !['monthly', 'yearly', 'lifetime'].includes(plan)) {
        return res.status(400).json({ error: 'Valid plan required' });
    }

    const id = uuidv4();
    const key = generateLicenseKey();
    const now = new Date().toISOString();

    try {
        await License.create({ id, key, plan, status: 'active', created_at: now, notes: notes || null });
        res.json({ success: true, license: { id, key, plan, status: 'active', created_at: now, notes } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate license', details: error.message });
    }
});

app.put('/api/admin/licenses/:id/revoke', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const license = await License.findOne({ id });
        if (!license) return res.status(404).json({ error: 'License not found' });

        license.status = 'revoked';
        await license.save();

        await Subscription.updateMany({ license_id: id }, { status: 'cancelled' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke license' });
    }
});

app.delete('/api/admin/licenses/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await License.deleteOne({ id });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'License not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete license' });
    }
});

app.get('/api/admin/trials', adminAuth, async (req, res) => {
    try {
        const trials = await UsedTrial.find().sort({ started_at: -1 });
        res.json(trials);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trials' });
    }
});

app.get('/api/admin/subscriptions', adminAuth, async (req, res) => {
    try {
        // Simple join simulation
        const subscriptions = await Subscription.find().sort({ started_at: -1 });
        // For a real join we would use aggregate or populate if refs were set up, 
        // but here we just fetch licenses to map keys if needed.
        // Keeping it simple for migration speed.
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const totalLicenses = await License.countDocuments();
        const activeLicenses = await License.countDocuments({ status: 'active' });
        const usedLicenses = await License.countDocuments({ status: 'used' });
        const revokedLicenses = await License.countDocuments({ status: 'revoked' });
        const totalTrials = await UsedTrial.countDocuments();
        const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

        res.json({ totalLicenses, activeLicenses, usedLicenses, revokedLicenses, totalTrials, activeSubscriptions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ==================== USER PROFILE ENDPOINTS ====================

app.post('/api/user-profile/save', async (req, res) => {
    const { machineId, name, email, phone, avatar, companyLogo, showLogoInPV, subscriptionStatus, subscriptionPlan, subscriptionStartDate, subscriptionExpiryDate } = req.body;
    if (!machineId) return res.status(400).json({ success: false, message: 'Machine ID required' });

    const now = new Date().toISOString();
    try {
        await UserProfile.findOneAndUpdate(
            { machine_id: machineId },
            {
                id: uuidv4(), // Only used on insert
                machine_id: machineId, name, email, phone, avatar, company_logo: companyLogo,
                show_logo_in_pv: showLogoInPV, subscription_status: subscriptionStatus,
                subscription_plan: subscriptionPlan, subscription_start_date: subscriptionStartDate,
                subscription_expiry_date: subscriptionExpiryDate, last_updated: now, created_at: now
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true, message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ success: false, message: 'Failed to save profile' });
    }
});

app.get('/api/user-profile/:machineId', async (req, res) => {
    const { machineId } = req.params;
    try {
        const profile = await UserProfile.findOne({ machine_id: machineId });
        if (!profile) return res.status(404).json({ profile: null });

        const profileObj = profile.toObject();
        profileObj.showLogoInPV = profileObj.show_logo_in_pv;
        delete profileObj.show_logo_in_pv;

        res.json({ profile: profileObj });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 License server running on http://localhost:${PORT}`);
});
