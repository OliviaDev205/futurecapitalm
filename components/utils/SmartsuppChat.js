// SmartsuppChat.js
"use client";
import { useEffect } from "react";

const SmartsuppChat = () => {
  useEffect(() => {
    // Dynamically add the Smartsupp chat script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://www.smartsuppchat.com/loader.js?";
    document.body.appendChild(script);

    // Set the Smartsupp key
    script.onload = () => {
      window._smartsupp = window._smartsupp || {};
      window._smartsupp.key = "c21ececc7a5b7466c5f859bbc4adc36a5bc2e6e1";
    };

    // Clean up the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []); // Empty dependency array to run once on mount

  return null; // This component doesn't need to render anything
};

export default SmartsuppChat;
