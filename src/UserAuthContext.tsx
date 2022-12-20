import { createContext, useContext, useEffect, useState } from "react";
import React from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from './firebase-config';

type UserAuthContextType =  {
  googleSignIn: Function;
  logOut: Function;
  user: any;
}

const userAuthContext = createContext<UserAuthContextType>({googleSignIn: () => {}, logOut: () => {}, user: null});

export function UserAuthContextProvider({ children } : any) {
  const [user, setUser] = useState({});

  function logIn(email : string, password : string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  function signUp(email : string, password : string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  function logOut() {
    return signOut(auth);
  }

  function googleSignIn() {
    const googleAuthProvider = new GoogleAuthProvider();
    return signInWithPopup(auth, googleAuthProvider);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentuser) => {
      if (currentuser)  {
        setUser(currentuser);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <userAuthContext.Provider
      //@ts-ignore - this type check is too deep down for me to figure out right now.
      value={{ user, logIn, signUp, logOut, googleSignIn }}
    >
      {children}
    </userAuthContext.Provider>
  );
}

export function useUserAuth() : UserAuthContextType {
  return useContext(userAuthContext);
}