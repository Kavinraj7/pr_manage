import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import readline from 'readline';
import fs from 'fs';

// Try loading .env.local if present
if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') {
  console.error('\x1b[31mError: Please set up your .env.local file with your Firebase credentials first.\x1b[0m');
  console.error('See .env.example for details.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n=========================================');
  console.log('  Create Initial Admin / Project Manager  ');
  console.log('=========================================\n');

  const name = (await question('Enter Admin Name (e.g. Admin User): ')).trim() || 'Admin User';
  const email = (await question('Enter Admin Email: ')).trim();
  const password = (await question('Enter Admin Password (min 6 characters): ')).trim();

  if (!email || !password || password.length < 6) {
    console.error('\x1b[31mError: Email is required and password must be at least 6 characters.\x1b[0m');
    rl.close();
    process.exit(1);
  }

  try {
    console.log('\nCreating user in Firebase Authentication...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    console.log(`Created Auth user with UID: ${uid}`);

    console.log('Creating user profile in Firestore "users" collection...');
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      name,
      email,
      role: 'PROJECT_MANAGER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log('\x1b[32m\nSUCCESS: Initial Project Manager account created successfully!\x1b[0m');
    console.log(`You can now log in at http://localhost:3000/login using:`);
    console.log(`Email:    ${email}`);
    console.log(`Role:     PROJECT_MANAGER\n`);
  } catch (err) {
    console.error('\x1b[31mFailed to create admin user:\x1b[0m', err.message);
  } finally {
    rl.close();
  }
}

main();
