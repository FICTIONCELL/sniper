const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Admin password
const ADMIN_PASSWORD = '127.0.0.1';

// Initialize database
const db = new Database(path.join(__dirname, 'licenses.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    activated_at TEXT,
    expires_at TEXT,
    machine_id TEXT,
    email TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS used_trials (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    email TEXT NOT NULL,
    device_name TEXT,
    started_at TEXT NOT NULL,
    expired_at TEXT NOT NULL,
    UNIQUE(machine_id, email)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    license_id TEXT,
    machine_id TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    started_at TEXT NOT NULL,
    expires_at TEXT,
    FOREIGN KEY (license_id) REFERENCES licenses(id)
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    machine_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    company_logo TEXT,
    show_logo_in_pv INTEGER DEFAULT 0,
    subscription_status TEXT,
    subscription_plan TEXT,
    subscription_start_date TEXT,
    subscription_expiry_date TEXT,
    last_updated TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Middleware
app.use(cors());
app.use(express.json());

// Generate a license key in format XXXX-XXXX-XXXX-XXXX
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

const bcrypt = require('bcryptjs');

// Admin password hash (bcrypt hash of '127.0.0.1')
const ADMIN_PASSWORD_HASH = '$2b$10$FO/GAF04g0XrZCPXwHvpcOgMpDiYvNIz8nyvpXgKxJwUhEhiMrBTC';

// Admin auth middleware
function adminAuth(req, res, next) {
    const password = req.headers['x-admin-password'];

    if (!password || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// ==================== TRIAL ENDPOINTS ====================

// Check if trial was already used
app.post('/api/trial/check', (req, res) => {
    const { machineId, email } = req.body;

    if (!machineId || !email) {
        return res.status(400).json({ error: 'Machine ID and email required' });
    }

    const trial = db.prepare(`
    SELECT * FROM used_trials 
    WHERE machine_id = ? OR email = ?
  `).get(machineId, email);

    res.json({
        canStartTrial: !trial,
        previousTrial: trial || null
    });
});


// Start a trial
app.post('/api/trial/start', (req, res) => {
    const { machineId, email, deviceName } = req.body;

    if (!machineId || !email) {
        return res.status(400).json({ error: 'Machine ID and email required' });
    }

    // Check if trial already used
    const existingTrial = db.prepare(`
    SELECT * FROM used_trials 
    WHERE machine_id = ? OR email = ?
  `).get(machineId, email);

    if (existingTrial) {
        return res.status(403).json({
            error: 'Trial already used',
            message: 'Cet appareil ou email a déjà utilisé la période d\'essai.',
            previousTrial: existingTrial
        });
    }

    // Create trial record
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const id = uuidv4();

    try {
        db.prepare(`
      INSERT INTO used_trials (id, machine_id, email, device_name, started_at, expired_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, machineId, email, deviceName || 'Unknown', now.toISOString(), expiresAt.toISOString());

        // Create subscription record for trial
        const subId = uuidv4();
        db.prepare(`
      INSERT INTO subscriptions (id, machine_id, email, plan, status, started_at, expires_at)
      VALUES (?, ?, ?, 'trial', 'active', ?, ?)
    `).run(subId, machineId, email, now.toISOString(), expiresAt.toISOString());

        res.json({
            success: true,
            trial: {
                id,
                machineId,
                email,
                startedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start trial', details: error.message });
    }
});

// ==================== LICENSE ENDPOINTS ====================

// Validate a license key
app.post('/api/license/validate', (req, res) => {
    const { key, machineId, email } = req.body;

    if (!key) {
        return res.status(400).json({ error: 'License key required' });
    }

    const license = db.prepare(`
    SELECT * FROM licenses WHERE key = ?
  `).get(key);

    if (!license) {
        return res.status(404).json({
            valid: false,
            error: 'License not found',
            message: 'Clé de licence invalide.'
        });
    }

    if (license.status === 'revoked') {
        return res.status(403).json({
            valid: false,
            error: 'License revoked',
            message: 'Cette licence a été révoquée.'
        });
    }

    if (license.status === 'used' && license.machine_id !== machineId) {
        return res.status(403).json({
            valid: false,
            error: 'License already activated on another device',
            message: 'Cette licence est déjà activée sur un autre appareil.'
        });
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return res.status(403).json({
            valid: false,
            error: 'License expired',
            message: 'Cette licence a expiré.'
        });
    }

    // Activate license if not already
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

        db.prepare(`
      UPDATE licenses 
      SET status = 'used', activated_at = ?, expires_at = ?, machine_id = ?, email = ?
      WHERE id = ?
    `).run(now.toISOString(), expiresAt?.toISOString(), machineId, email, license.id);

        // Create subscription record
        const subId = uuidv4();
        db.prepare(`
      INSERT INTO subscriptions (id, license_id, machine_id, email, plan, status, started_at, expires_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(subId, license.id, machineId, email, license.plan, now.toISOString(), expiresAt?.toISOString());

        license.status = 'used';
        license.activated_at = now.toISOString();
        license.expires_at = expiresAt?.toISOString();
        license.machine_id = machineId;
        license.email = email;
    }

    res.json({
        valid: true,
        license: {
            id: license.id,
            key: license.key,
            plan: license.plan,
            status: license.status,
            activatedAt: license.activated_at,
            expiresAt: license.expires_at
        }
    });
});

// ==================== ADMIN ENDPOINTS ====================

// Get all licenses (admin)
app.get('/api/admin/licenses', adminAuth, (req, res) => {
    const licenses = db.prepare('SELECT * FROM licenses ORDER BY created_at DESC').all();
    res.json(licenses);
});

// Generate a new license (admin)
app.post('/api/admin/licenses', adminAuth, (req, res) => {
    const { plan, notes } = req.body;

    if (!plan || !['monthly', 'yearly', 'lifetime'].includes(plan)) {
        return res.status(400).json({ error: 'Valid plan required (monthly, yearly, lifetime)' });
    }

    const id = uuidv4();
    const key = generateLicenseKey();
    const now = new Date().toISOString();

    try {
        db.prepare(`
      INSERT INTO licenses (id, key, plan, status, created_at, notes)
      VALUES (?, ?, ?, 'active', ?, ?)
    `).run(id, key, plan, now, notes || null);

        res.json({
            success: true,
            license: { id, key, plan, status: 'active', created_at: now, notes }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate license', details: error.message });
    }
});

// Revoke a license (admin)
app.put('/api/admin/licenses/:id/revoke', adminAuth, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare(`
      UPDATE licenses SET status = 'revoked' WHERE id = ?
    `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'License not found' });
        }

        // Also update subscription status
        db.prepare(`
      UPDATE subscriptions SET status = 'cancelled' WHERE license_id = ?
    `).run(id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke license', details: error.message });
    }
});

// Delete a license (admin)
app.delete('/api/admin/licenses/:id', adminAuth, (req, res) => {
    const { id } = req.params;

    try {
        const result = db.prepare('DELETE FROM licenses WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'License not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete license', details: error.message });
    }
});

// Get all used trials (admin)
app.get('/api/admin/trials', adminAuth, (req, res) => {
    const trials = db.prepare('SELECT * FROM used_trials ORDER BY started_at DESC').all();
    res.json(trials);
});

// Get all subscriptions (admin)
app.get('/api/admin/subscriptions', adminAuth, (req, res) => {
    const subscriptions = db.prepare(`
    SELECT s.*, l.key as license_key 
    FROM subscriptions s 
    LEFT JOIN licenses l ON s.license_id = l.id 
    ORDER BY s.started_at DESC
  `).all();
    res.json(subscriptions);
});

// Get statistics (admin)
app.get('/api/admin/stats', adminAuth, (req, res) => {
    const totalLicenses = db.prepare('SELECT COUNT(*) as count FROM licenses').get().count;
    const activeLicenses = db.prepare("SELECT COUNT(*) as count FROM licenses WHERE status = 'active'").get().count;
    const usedLicenses = db.prepare("SELECT COUNT(*) as count FROM licenses WHERE status = 'used'").get().count;
    const revokedLicenses = db.prepare("SELECT COUNT(*) as count FROM licenses WHERE status = 'revoked'").get().count;
    const totalTrials = db.prepare('SELECT COUNT(*) as count FROM used_trials').get().count;
    const activeSubscriptions = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get().count;

    res.json({
        totalLicenses,
        activeLicenses,
        usedLicenses,
        revokedLicenses,
        totalTrials,
        activeSubscriptions
    });
});

// ==================== USER PROFILE ENDPOINTS ====================

// Save user profile
app.post('/api/user-profile/save', (req, res) => {
    const {
        machineId,
        name,
        email,
        phone,
        avatar,
        companyLogo,
        showLogoInPV,
        subscriptionStatus,
        subscriptionPlan,
        subscriptionStartDate,
        subscriptionExpiryDate
    } = req.body;

    if (!machineId) {
        return res.status(400).json({ success: false, message: 'Machine ID required' });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    try {
        // Check if profile exists
        const existing = db.prepare('SELECT id FROM user_profiles WHERE machine_id = ?').get(machineId);

        if (existing) {
            // Update existing profile
            db.prepare(`
                UPDATE user_profiles 
                SET name = ?, email = ?, phone = ?, avatar = ?, company_logo = ?, 
                    show_logo_in_pv = ?, subscription_status = ?, subscription_plan = ?,
                    subscription_start_date = ?, subscription_expiry_date = ?, last_updated = ?
                WHERE machine_id = ?
            `).run(
                name, email, phone, avatar, companyLogo, showLogoInPV ? 1 : 0,
                subscriptionStatus, subscriptionPlan, subscriptionStartDate, subscriptionExpiryDate,
                now, machineId
            );
        } else {
            // Create new profile
            db.prepare(`
                INSERT INTO user_profiles (
                    id, machine_id, name, email, phone, avatar, company_logo, show_logo_in_pv,
                    subscription_status, subscription_plan, subscription_start_date, subscription_expiry_date,
                    last_updated, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id, machineId, name, email, phone, avatar, companyLogo, showLogoInPV ? 1 : 0,
                subscriptionStatus, subscriptionPlan, subscriptionStartDate, subscriptionExpiryDate,
                now, now
            );
        }

        res.json({ success: true, message: 'Profile saved successfully' });
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ success: false, message: 'Failed to save profile' });
    }
});

// Get user profile
app.get('/api/user-profile/:machineId', (req, res) => {
    const { machineId } = req.params;

    try {
        const profile = db.prepare('SELECT * FROM user_profiles WHERE machine_id = ?').get(machineId);

        if (!profile) {
            return res.status(404).json({ profile: null });
        }

        // Convert show_logo_in_pv from integer to boolean
        profile.showLogoInPV = profile.show_logo_in_pv === 1;
        delete profile.show_logo_in_pv;

        res.json({ profile });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 License server running on http://localhost:${PORT}`);
    console.log(`📊 Admin password: ${ADMIN_PASSWORD}`);
});
