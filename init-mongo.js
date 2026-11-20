// Script to initialize collections and seed your MongoDB Atlas database
const path = require('path');
const fs = require('fs');

// 1. Load .env
try {
    process.loadEnvFile();
} catch (e) {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const [key, ...vals] = trimmed.split('=');
                    const val = vals.join('=').replace(/^["']|["']$/g, '').trim();
                    if (!process.env[key.trim()]) process.env[key.trim()] = val;
                }
            });
        }
    } catch (err) { }
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function setupAtlas() {
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', mongoUri ? mongoUri.replace(/:([^@]+)@/, ':****@') : 'MISSING');

    let MongoClient;
    try {
        MongoClient = require('mongodb').MongoClient;
    } catch (err) {
        console.error('\n[ERROR] The "mongodb" driver is not installed in node_modules yet!');
        console.error('Please run: npm install mongodb\n');
        process.exit(1);
    }

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('✓ Connected successfully to MongoDB Atlas cluster!');

        const db = client.db('webplus');

        // 1. Create or seed "users"
        const usersCount = await db.collection('users').countDocuments();
        if (usersCount === 0) {
            await db.collection('users').insertOne({
                name: "Admin User",
                email: "admin@webplus.in",
                role: "admin",
                createdAt: new Date()
            });
            console.log('✓ Collection created: users');
        } else {
            console.log(`✓ Collection users already exists (${usersCount} docs)`);
        }

        // 2. Create or seed "audits"
        const auditsCount = await db.collection('audits').countDocuments();
        if (auditsCount === 0) {
            const { SAMPLE_DEMO_REPORT } = require('./lib/mockDemoData');
            await db.collection('audits').insertOne(SAMPLE_DEMO_REPORT);
            console.log('✓ Collection created: audits');
        } else {
            console.log(`✓ Collection audits already exists (${auditsCount} docs)`);
        }

        // 3. Create or seed "leads"
        const leadsCount = await db.collection('leads').countDocuments();
        if (leadsCount === 0) {
            const { readDb } = require('./lib/storage');
            const initialLeads = readDb().leads || [];
            if (initialLeads.length > 0) {
                await db.collection('leads').insertMany(initialLeads);
            }
            console.log('✓ Collection created: leads');
        } else {
            console.log(`✓ Collection leads already exists (${leadsCount} docs)`);
        }

        // 4. Create or seed "discovery_conversations"
        const discCount = await db.collection('discovery_conversations').countDocuments();
        if (discCount === 0) {
            const { readDb } = require('./lib/storage');
            const initialConv = readDb().discoveryConversations || [];
            if (initialConv.length > 0) {
                await db.collection('discovery_conversations').insertMany(initialConv);
            }
            console.log('✓ Collection created: discovery_conversations');
        } else {
            console.log(`✓ Collection discovery_conversations already exists (${discCount} docs)`);
        }

        // 5. Create or seed "channel_metrics"
        const chanCount = await db.collection('channel_metrics').countDocuments();
        if (chanCount === 0) {
            const { readDb } = require('./lib/storage');
            const initialChan = readDb().channelMetrics || [];
            if (initialChan.length > 0) {
                await db.collection('channel_metrics').insertMany(initialChan);
            }
            console.log('✓ Collection created: channel_metrics');
        } else {
            console.log(`✓ Collection channel_metrics already exists (${chanCount} docs)`);
        }

        console.log('\n====================================================');
        console.log('  SUCCESS! All collections and initial schemas are');
        console.log('  now created and visible in your MongoDB Atlas cluster.');
        console.log('  Open cloud.mongodb.com -> Browse Collections -> webplus');
        console.log('====================================================\n');

    } catch (err) {
        console.error('Error connecting to Atlas:', err.message);
    } finally {
        await client.close();
    }
}

setupAtlas();