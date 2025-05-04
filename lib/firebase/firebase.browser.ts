// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Modular import for auth
import { getFirestore, collection } from "firebase/firestore"; // Modular import for Firestore
import { getStorage } from "firebase/storage"; // Modular import for Storage

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const analytics = getAnalytics(app);
export const auth = getAuth(app); // Using getAuth instead of app.auth()
export const firestore = getFirestore(app); // Using getFirestore instead of app.firestore()
export const storage = getStorage(app); // Using getStorage instead of app.storage()

// export const usersCollection = collection(firestore, "users");
export const productsCollection = collection(firestore, "products");
// export const ordersCollection = collection(firestore, "orders");

export default app;
