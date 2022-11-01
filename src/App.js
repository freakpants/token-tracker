// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import React, { Component } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Logo from "./assets/logopc.png";
import Twitter from "./assets/twitter.svg";
import WcToken from "./assets/wctoken.png";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokens: [],	
    };

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyBZjAp5aWnUV9y_AbI0UeN8fMSco9L7U3U",
      authDomain: "pack-collector.firebaseapp.com",
      projectId: "pack-collector",
      storageBucket: "pack-collector.appspot.com",
      messagingSenderId: "935679710199",
      appId: "1:935679710199:web:906c3ac232f7d9fecf54f2",
      measurementId: "G-60T2BG3K5X",
      databaseURL:
        "https://pack-collector-default-rtdb.europe-west1.firebasedatabase.app/",
    };

    const fireApp = initializeApp(firebaseConfig);

    const appCheck = initializeAppCheck(fireApp, {
      provider: new ReCaptchaV3Provider(
        "6Lfj7aAiAAAAAOZtB0a6MNtSRdFFdCxk5hCPkjWC"
      ),
      isTokenAutoRefreshEnabled: true,
    });

    this.appCheck = appCheck;

    this.fireApp = fireApp;

    const functions = getFunctions(fireApp);
    this.functions = functions;

    const analytics = getAnalytics(fireApp);
    this.analytics = analytics;

    this.database = getDatabase(fireApp);

    this.GoogleAuthProvider = new GoogleAuthProvider();

    // this.provider = new TwitterAuthProvider();
    this.auth = getAuth();

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        // write user object to local storage
        localStorage.setItem("user", JSON.stringify(user));

        // this.setState({ user: user });
      } else {
        // User is signed out
        localStorage.setItem("user", JSON.stringify(user));

        this.setState({ user: false });
      }
    });
  }

  componentDidMount() {
        // get the players from the json file
        let tokens = require("./Tokens.json");
        this.setState({ tokens: tokens });
  }

  render() {
    const theme = createTheme({
      typography: {
        fontFamily: "Matroska",
        fontSize: 12,
        color: "#F8EEDE",
      },
      palette: {
        primary: {
          main: "#ff6a00",
        },
        secondary: {
          main: "#edf2ff",
        },
        lightgray: {
          main: "#292f35",
        },
        lightergray: {
          main: "#505a64",
        },
      },
    });

    console.log(this.state.tokens);

    return (
      <ThemeProvider theme={theme}>
        <div className={"logo"}>
          <img className={"logo__img"} src={Logo} alt="FUT23 Pack Collector" />
          <div className={"logo__twitter"}>
            <a href="https://twitter.com/FUTCoder" rel="noreferrer" target="_blank"><img alt="Twitter Logo" src={Twitter} /> FUT Coder</a> x{" "}
            <a href="https://twitter.com/Kimpembro" rel="noreferrer" target="_blank"><img alt="Twitter Logo" src={Twitter} /> Kimpembro</a> x{" "}
            <a href="https://twitter.com/Fleck_GFX" rel="noreferrer" target="_blank"><img alt="Twitter Logo" src={Twitter} /> Fleck</a></div>
        </div>
        <div id="tokens">
        {this.state.tokens.length > 0 && (
          this.state.tokens.map((token) => {
            return (
              
              <div key={token.definitionId} className={"token"}>
                <img className="background" src={WcToken} alt="WC Token" />
                {token.bestQualityImage === "futbin" && (
                  <img className="avatar" src={"https://cdn.futbin.com/content/fifa23/img/players/" + token.playerId + ".png"} />
                )}
                <div className="name">{token.knownAs ? token.knownAs : token.lastName}</div>
              </div>
              
            );
          })
         )}
         </div>
      </ThemeProvider>
    );
  }
}
export default App;
