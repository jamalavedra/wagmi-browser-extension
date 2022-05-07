import firebase from 'firebase/app'

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
}

export const getFirebase = () => {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig)
    }
    return firebase
}
