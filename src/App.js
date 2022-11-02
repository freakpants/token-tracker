// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { GoogleAuthProvider, getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import React, { Component } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Logo from "./assets/logopc.png";
import Twitter from "./assets/twitter.svg";
import WcToken from "./assets/wctoken.png";
import WcTokenNew from "./assets/wctokennew.png";
import SBC from "./assets/sbc.png";
import XP from "./assets/xp.png";
import PACK from "./assets/pack.png";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tokens: [],
      total: 0,
      claimed: 0,
      expiredCount: 0,
      missed: 0,
      max: 0,
    };

    this.handleTokenClick = this.handleTokenClick.bind(this);
    this.calculateTotal = this.calculateTotal.bind(this);

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
    let expiredCount = 0;
    tokens.forEach((token) => {
      // calculate and add expiry difference in days
      let expiry = new Date(token.swap_expiry);
      expiry.setUTCHours(17, 0, 0, 0);
      let today = new Date();
      let diff = expiry.getTime() - today.getTime();
      if (diff < 0) {
        token.expired = true;
        expiredCount++;
      } else {
        let days = Math.ceil(diff / (1000 * 3600 * 24));
        if (days < 4) {
          // calculate and add expiry difference in hours and minutes
          let hours = Math.floor(diff / (1000 * 3600));
          let minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
          token.expiry = `${hours}h ${minutes}m`;
        } else {
          token.expiry = days + " days";
        }
      }
      // randomly assign claimed
      token.claimed = Math.random() < 0.5;
    });
    this.setState(
      { tokens: tokens, expiredCount: expiredCount },
      this.calculateTotal
    );
  }

  handleTokenClick(tokenId) {
    // modify the token in the state
    let tokens = this.state.tokens;
    let token = tokens.find((token) => token.definitionId === tokenId);
    token.claimed = !token.claimed;
    this.setState({ tokens: tokens }, this.calculateTotal);
  }

  calculateTotal() {
    // calculate the total number of tokens and the number of claimed tokens
    const tokens = this.state.tokens;
    const total = tokens.length;
    const claimed = tokens.filter((token) => token.claimed).length;

    const missed = tokens.filter(
      (token) => !token.claimed && token.expired
    ).length;

    const max = total - missed;

    this.setState({ total: total, claimed: claimed, missed: missed, max: max });
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

    return (
      <ThemeProvider theme={theme}>
        <div className={"headerArea"}>
          <div id="counter__wrapper">          <div id="counters">
            <div className={"counter__item"}>
              <div className={"counter__title"}>Total</div>
              <div className={"counter__value"}>{this.state.total}</div>
            </div>
            <div className={"counter__item"}>
              <div className={"counter__title"}>Claimed</div>
              <div className={"counter__value"}>{this.state.claimed}</div>
            </div>
            <div className={"counter__item"}>
              <div className={"counter__title"}>Expired</div>
              <div className={"counter__value"}>{this.state.expiredCount}</div>
            </div>
            <div className={"counter__item"}>
              <div className={"counter__title"}>Missed</div>
              <div className={"counter__value"}>{this.state.missed}</div>
            </div>
            <div className={"counter__item"}>
              <div className={"counter__title"}>Max</div>
              <div className={"counter__value"}>{this.state.max}</div>
            </div>
          </div></div>


          <div className={"logo"}>
            {/* <img
              className={"logo__img"}
              src={Logo}
              alt="FUT23 Pack Collector"
            /> */}
            <div className={"logo__title"}>
              World Cup 2022
            </div>            
            <div className={"logo__subtitle"}>
              Token Tracker
            </div>
            <div className={"logo__twitter"}>
              <a
                href="https://twitter.com/FUTCoder"
                rel="noreferrer"
                target="_blank"
              >
                <img alt="Twitter Logo" src={Twitter} /> FUT Coder
              </a>{" "}
              x{" "}
              <a
                href="https://twitter.com/Kimpembro"
                rel="noreferrer"
                target="_blank"
              >
                <img alt="Twitter Logo" src={Twitter} /> Kimpembro
              </a>{" "}
              x{" "}
              <a
                href="https://twitter.com/Fleck_GFX"
                rel="noreferrer"
                target="_blank"
              >
                <img alt="Twitter Logo" src={Twitter} /> Fleck
              </a>
            </div>
          </div>
          <div className={"controls"}>
            Buttons etc 
          </div>
        </div>

        <div id="tokens">
          {this.state.tokens.length > 0 &&
            this.state.tokens.map((token) => {
              let tokenClassName = "token";
              if (token.claimed) {
                tokenClassName += " claimed";
              }
              if (token.expired) {
                tokenClassName += " expired";
              }
              return (
                <div
                  onClick={() => this.handleTokenClick(token.definitionId)}
                  key={token.definitionId}
                  className={tokenClassName}
                >
                  <img className="background" src={WcTokenNew} alt="WC Token" />
                  {token.bestQualityImage === "futbin" && (
                    <img
                      className="avatar"
                      src={
                        "https://cdn.futbin.com/content/fifa23/img/players/" +
                        token.playerId +
                        ".png"
                      }
                    />
                  )}
                  <div className="rating">{token.rating}</div>
                  <div className="mainPosition">{token.mainPosition}</div>
                  <img
                    className="nation"
                    src={
                      "https://cdn.futbin.com/content/fifa23/img/nation/" +
                      token.nationId +
                      ".png"
                    }
                  />
                  <img
                    className="club"
                    src={
                      "https://cdn.futbin.com/content/fifa23/img/clubs/" +
                      token.teamId +
                      ".png"
                    }
                  />
                  <div className="name">
                    {token.knownAs && token.knownAs !== "---"
                      ? token.knownAs
                      : token.lastName}
                  </div>
                  <div className="expiry">
                    {token.expired ? "Expired" : token.expiry + " LEFT"}
                    <br />
                    {token.swap_source}
                    {token.swap_source_type === "sbc" && (
                      <img src={SBC} className="sbc-icon" alt="SBC" />
                    )}
                    {token.swap_source_type === "objective" && (
                      <img src={XP} className="xp-icon" alt="Objective" />
                    )}
                    {token.swap_source_type === "pack" && (
                      <img src={PACK} className="pack-icon" alt="Pack" />
                    )}
                  </div>
                  <div className="counter">{token.swap_id}</div>
                </div>
              );
            })}
        </div>
      </ThemeProvider>
    );
  }
}
export default App;
