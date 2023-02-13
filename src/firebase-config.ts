import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCGr7xczPkoHFQW-GanSAoAZZFGfLrYiTI",
    authDomain: "sd-parseq.firebaseapp.com",
    projectId: "sd-parseq",
    storageBucket: "sd-parseq.appspot.com",
    messagingSenderId: "830535540412",
    appId: "1:830535540412:web:858dde0a82381e6f32bab9",
    measurementId: "G-TPY8W4RQ83"
  };
   
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);