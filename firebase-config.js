/**
 * Firebase 설정 및 초기화
 * 주제별 의견 앱 - Chapter4
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrbqdg3kaWJ0Z5_k8vcDYT4VSJ6HPSvzI",
  authDomain: "chatting-lbh.firebaseapp.com",
  projectId: "chatting-lbh",
  storageBucket: "chatting-lbh.firebasestorage.app",
  messagingSenderId: "280779303116",
  appId: "1:280779303116:web:c6ff61e39812277954ba69",
  measurementId: "G-YEJVBQJLQQ",
  databaseURL: "https://chatting-lbh-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
