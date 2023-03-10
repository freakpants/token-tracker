/*
3 tokens = 1040 x 585
8 tokens = 1142 x 724
15 tokens = 1402 x 787
21 tokens = 1600 x 969
32 = 1920 x 1080
50 tokens screenshot = 2400*1350
*/

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithRedirect,
} from "firebase/auth";
import { getDatabase, set, ref, onValue, remove } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  Button,
  Paper,
  FormGroup,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import React, { Component } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Logo from "./assets/logopc.png";
import Twitter from "./assets/twitter.svg";
import FutureToken from "./assets/futuretoken.png";
import FutureLogo from "./assets/futurelogo.png";
import SBC from "./assets/sbc.png";
import XP from "./assets/xp.png";
import PACK from "./assets/pack.png";
import GoogleLoginButton from "./assets/googleloginbutton.png";
import Loader from "react-loaders";
import Spartanfut from "./assets/spartanfut.png";

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
      user: null,
      profile: "default",
      profiles: ["default"],
      loggingIn: true,
      editingProfile: false,
      mode: false,
      profileNameInput: "",
      optionsExpanded: false,
      orderBy: "number",
      objectives: true,
      sbcs: true,
      packs: true,
      unclaimedFilter: true,
      claimedFilter: true,
      expiredFilter: true,
      screenshotMode: false,
    };

    this.handleTokenClick = this.handleTokenClick.bind(this);
    this.calculateTotal = this.calculateTotal.bind(this);
    this.triggerGoogleLogin = this.triggerGoogleLogin.bind(this);
    this.saveTokens = this.saveTokens.bind(this);
    this.triggerGoogleLogout = this.triggerGoogleLogout.bind(this);
    this.handleAddProfile = this.handleAddProfile.bind(this);
    this.handleCancelProfile = this.handleCancelProfile.bind(this);
    this.handleSaveProfile = this.handleSaveProfile.bind(this);
    this.handleAddProfile = this.handleAddProfile.bind(this);
    this.handleEditProfile = this.handleEditProfile.bind(this);
    this.handleDeleteProfile = this.handleDeleteProfile.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleOptionExpansion = this.handleOptionExpansion.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyBZjAp5aWnUV9y_AbI0UeN8fMSco9L7U3U",
      authDomain: "pack-collector.firebaseapp.com",
      databaseURL: "https://pack-collector-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "pack-collector",
      storageBucket: "pack-collector.appspot.com",
      messagingSenderId: "935679710199",
      appId: "1:935679710199:web:ffd442a33fb885e1cf54f2",
      measurementId: "G-8ZML73NVJ4"
    };

    const fireApp = initializeApp(firebaseConfig);

    const appCheck = initializeAppCheck(fireApp, {
      provider: new ReCaptchaV3Provider(
        "6LeTleAkAAAAADU-IaZfiKrrHNrErJmwD9aQoVOq"
      ),
      isTokenAutoRefreshEnabled: true,
    });

    this.appCheck = appCheck;

    this.fireApp = fireApp;

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

        // get tokens from firebase
        const { uid } = user;

        let profiles = {};
        // get profiles from firebase
        onValue(ref(this.database, `tokens/worldcup/${uid}`), (snapshot) => {
          const data = snapshot.val();
          if (data) {
            profiles = Object.keys(data);
            if (
              JSON.stringify(profiles) !== JSON.stringify(this.state.profiles)
            ) {
              console.log("profiles in state", this.state.profiles);
              console.log("profiles in firebase", profiles);
              console.log(
                "setting profiles to cloud state and setting first cloud profile to active"
              );
              this.setState({ profiles: profiles, profile: profiles[0] });
            } 
            // get tokens from firebase
            let tokenStorage = {};

            profiles.forEach((profile) => {
              onValue(
                ref(this.database, `tokens/worldcup/${uid}/${profile}`),
                (snapshot) => {
                  const data = snapshot.val();
                  if (data) {
                    if (profile === this.state.profile) {
                      // go through each token and set claimed status if it was in the data
                      const tokens = this.state.tokens;
                      tokens.map((token) => {
                        // check if this tokens definition id is in the data
                        if (data.includes(token.definitionId)) {
                          token.claimed = true;
                        }
                        return token;
                      });
                      console.log("setting tokens from firebase");
                      this.setState({ tokens: tokens }, this.calculateTotal);
                    }
                    tokenStorage[profile] = data;
                  }
                }
              );
            });
            console.log("setting token storage");
            console.log(tokenStorage);
            console.log(JSON.stringify(profiles));
            // save tokens to local storage
            localStorage.setItem("tokens", JSON.stringify(tokenStorage));
            // save profiles to local storage
            localStorage.setItem("profiles", JSON.stringify(profiles));
            // save profile to local storage
            localStorage.setItem("profile", profiles[0]);
          }
        });

        console.log("setting status to logged in");
        this.setState({ user: user, loggingIn: false });
      } else {
        // User is signed out
        localStorage.setItem("user", JSON.stringify(user));

        this.setState({ user: false, loggingIn: false });
      }
    });
  }

  triggerGoogleLogin() {
    signInWithRedirect(this.auth, this.GoogleAuthProvider);
  }

  triggerGoogleLogout() {
    this.auth.signOut();
  }

  handleOptionExpansion() {
    this.setState((prevState) => {
      let oldState = prevState["optionsExpanded"];
      return {
        optionsExpanded: !oldState,
      };
    });
  }

  handleCheckboxChange(event) {
    const { name } = event.target;
    this.setState(
      (prevState) => {
        let oldState = prevState[name];

        return {
          [name]: !oldState,
        };
      },
      () => {}
    );
  }

  saveTokens() {
    console.log("saving tokens");
    const { tokens, profile } = this.state;

    // only keep claimed status of tokens
    let tokensToSave = [];

    tokens.map((token) => {
      if (token.claimed) {
        tokensToSave.push(token.definitionId);
      }
      return token;
    });

    if (this.state.user) {
      const { uid } = this.state.user;

      // save to firebase realtime database if there are more than zero tokens, otherwise firebase will delete the node
      if (tokensToSave.length > 0) {
        set(
          ref(this.database, `tokens/worldcup/${uid}/${profile}`),
          tokensToSave
        );
      }
    }

    // save to local storage
    let tokenStorage = JSON.parse(localStorage.getItem("tokens"));
    if (!tokenStorage) {
      tokenStorage = {};
    }
    tokenStorage[profile] = tokensToSave;
    localStorage.setItem("tokens", JSON.stringify(tokenStorage));
    this.calculateTotal();
  }

  handleAddProfile() {
    this.setState({ profileNameInput: "", editingProfile: true, mode: "add" });
  }
  handleEditProfile() {
    this.setState({
      editingProfile: true,
      mode: "edit",
      profileNameInput: this.state.profile,
    });
  }

  handleDeleteProfile() {
    if (this.state.profiles.length > 1) {
      if (window.confirm("Are you sure you want to delete this profile?")) {
        const { profile } = this.state;
        console.log("deleting profile", profile);
        // remove from profiles array
        const profiles = this.state.profiles.filter((p) => p !== profile);
        console.log(profiles);
        this.setState({ profile: profiles[0], profiles: profiles }, () => {});
        localStorage.setItem("profiles", JSON.stringify(profiles));
        localStorage.setItem("profile", profiles[0]);
        // remove from firebase
        if (this.state.user) {
          const { uid } = this.state.user;
          remove(ref(this.database, `tokens/worldcup/${uid}/${profile}`));
        }
      }
    } else {
      alert("You can't delete the only profile.");
    }
  }

  handleSaveProfile() {
    if (this.state.mode === "add") {
      const profiles = this.state.profiles;
      profiles.push(this.state.profileNameInput);
      // set all tokens to unclaimed
      const tokens = this.state.tokens;
      tokens.map((token) => {
        token.claimed = false;
        return token;
      });

      // save to firebase
      if (this.state.user) {
        const { uid } = this.state.user;
        const profile = this.state.profileNameInput;
        set(ref(this.database, `tokens/worldcup/${uid}/${profile}`), {});
      }

      this.setState({
        tokens: tokens,
        profiles: profiles,
        editingProfile: false,
        profile: this.state.profileNameInput,
      });
    }
    const profiles = this.state.profiles;
    if (this.state.mode === "edit") {
      const previousName = this.state.profile;
      const index = profiles.indexOf(this.state.profile);
      profiles[index] = this.state.profileNameInput;
      this.setState({
        profiles: profiles,
        editingProfile: false,
        profile: this.state.profileNameInput,
      });
      if (this.state.user) {
        const { uid } = this.state.user;
        // delete previous profile from firebase
        remove(ref(this.database, `tokens/worldcup/${uid}/${previousName}`));
        // save new profile to firebase
        const tokensToSave = [];
        this.state.tokens.map((token) => {
          if (token.claimed) {
            tokensToSave.push(token.definitionId);
          }
          return token;
        });
        const profile = this.state.profileNameInput;
        set(
          ref(this.database, `tokens/worldcup/${uid}/${profile}`),
          tokensToSave
        );
      }
    }
    this.setState({ editingProfile: false, mode: false });
    // save profiles to local storage
    localStorage.setItem("profiles", JSON.stringify(profiles));
    localStorage.setItem("profile", this.state.profileNameInput);
  }

  componentDidMount() {
    // get the players from the json file
    let tokens = require("./Tokens.json");
    let expiredCount = 0;

    // check if we have a local profile
    let profile = localStorage.getItem("profile");
    if (!profile) {
      // save selected profile to local storage
      localStorage.setItem("profile", this.state.profile);
      // save all profiles to local storage
      localStorage.setItem("profiles", JSON.stringify(this.state.profiles));
      profile = this.state.profile;
    } else {
      // set profile from local storage
      this.setState({
        profile: profile,
        profiles: JSON.parse(localStorage.getItem("profiles")),
      });
    }

    // check if we have a local token storage
    const tokenStorage = localStorage.getItem("tokens");
    // get the tokens from local storage
    const tokensFromStorage = JSON.parse(tokenStorage);

    if (tokenStorage && tokensFromStorage[profile]) {
      // get the tokens for the selected profile
      const tokensForProfile = tokensFromStorage[profile];
      // loop through the tokens and set the claimed status
      tokens.map((token) => {
        if (tokensForProfile.includes(token.definitionId)) {
          token.claimed = true;
        }
        return token;
      });
    }

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
    });
    console.log("setting initial token state");
    this.setState(
      { tokens: tokens, expiredCount: expiredCount },
      this.calculateTotal
    );
  }

  handleCancelProfile() {
    this.setState({ editingProfile: false });
  }

  handleTokenClick(tokenId) {
    // modify the token in the state
    let tokens = this.state.tokens;
    let token = tokens.find((token) => token.definitionId === tokenId);
    token.claimed = !token.claimed;
    this.setState({ tokens: tokens }, this.saveTokens);
  }

  calculateTotal() {
    console.log("calculating total");
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

  handleInputChange(event) {
    let { name, value } = event.target;
    let tokens = this.state.tokens;
    if (name === "profile") {
      // get the tokens for the selected profile
      const tokenStorage = JSON.parse(localStorage.getItem("tokens"));
      if (tokenStorage && tokenStorage[value]) {
        const tokensForProfile = tokenStorage[value];

        // loop through the tokens and set the claimed status

        tokens.map((token) => {
          if (tokensForProfile.includes(token.definitionId)) {
            token.claimed = true;
          } else {
            token.claimed = false;
          }
          return token;
        });
        this.setState({ [name]: value, tokens: tokens }, this.calculateTotal);
      } else {
        // no tokens for this profile, set all to unclaimed
        tokens.map((token) => {
          token.claimed = false;
          return token;
        });
        this.setState({ [name]: value, tokens: tokens }, this.calculateTotal);
      }
    } else {
      this.setState({
        [name]: value,
      });
    }
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
          main: "#b90040",
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

    let sortedTokens;
    if (this.state.orderBy === "expiry") {
      sortedTokens = [...this.state.tokens].sort((a, b) => {
        // convert expiry to date then compare
        let aDate = new Date(a.swap_expiry);
        let bDate = new Date(b.swap_expiry);
        return aDate - bDate;
      });
    } else {
      sortedTokens = this.state.tokens;
    }

    if(!this.state.sbcs){
      // hide sbc tokens
      sortedTokens = sortedTokens.filter((token) => token.swap_source_type !== 'sbc');
    }
    if(!this.state.objectives){
      // hide objective tokens
      sortedTokens = sortedTokens.filter((token) => token.swap_source_type !== 'objective');
    }
    if(!this.state.packs){
      // hide pack tokens
      sortedTokens = sortedTokens.filter((token) => token.swap_source_type !== 'pack');
    }

    if(!this.state.unclaimedFilter){
      sortedTokens = sortedTokens.filter((token) => token.claimed);
    }

    if(!this.state.claimedFilter){
      sortedTokens = sortedTokens.filter((token) => !token.claimed);
    }

    if(!this.state.expiredFilter){
      sortedTokens = sortedTokens.filter((token) => !token.expired);
    }

    return (
      <ThemeProvider theme={theme}>
        <div className={"headerArea"}>
          {this.state.screenshotMode && (
            <div className={"creator"}>
              <img src={Spartanfut} alt="creator" />
            </div>
          )}

          <div id="counter__wrapper">
            <div className={"logo__title"}><img alt="futurestarslogo" className={"futurelogo"} src={FutureLogo} /></div>
            <div id="counters">
              <div className={"counter__item"}>
                <div className={"counter__title"}>Total</div>
                <div className={"counter__value"}>{this.state.total}</div>
              </div>
              { !this.state.screenshotMode && (
              <div className={"counter__item"}>
                <div className={"counter__title"}>Claimed</div>
                <div className={"counter__value"}>{this.state.claimed}</div>
              </div>
              )}
              <div className={"counter__item"}>
                <div className={"counter__title"}>Expired</div>
                <div className={"counter__value"}>
                  {this.state.expiredCount}
                </div>
              </div>
              {!this.state.screenshotMode && (
              <div className={"counter__item"}>
                <div className={"counter__title"}>Missed</div>
                <div className={"counter__value"}>{this.state.missed}</div>
              </div>
              )}
              <div className={"counter__item"}>
                <div className={"counter__title"}>Max</div>
                <div className={"counter__value"}>{this.state.max}</div>
              </div>
            </div>
          </div>

          <div className={"logo"}>
            <img className={"logo__img"} src={Logo} alt="FUT23 Token Tracker" />
            <div className={"logo__twitter"}>
              <a
                href="https://twitter.com/FUTCoder"
                rel="noreferrer"
                target="_blank"
              >
                <img alt="Twitter Logo" src={Twitter} /> FUT Coder
              </a>
              <a
                href="https://twitter.com/Kimpembro"
                rel="noreferrer"
                target="_blank"
              >
                <img alt="Twitter Logo" src={Twitter} /> Kimpembro
              </a>
            </div>
          </div>
          { ! this.state.screenshotMode && (
          <div className={"filter"}>
            <Paper elevation={0}>
              {!this.state.user && !this.state.loggingIn && (
                <img
                  class="LoginButton"
                  alt="Google Login"
                  onClick={this.triggerGoogleLogin}
                  src={
                    GoogleLoginButton
                  }
                />
              )}
              {this.state.loggingIn && <Loader type="line-scale" active />}
              {this.state.user && !this.state.loggingIn && (
                <React.Fragment>
                  <div className={"displayName"}>
                    Logged in as {this.state.user.displayName}
                  </div>
                  <Button
                    onClick={this.triggerGoogleLogout}
                    variant="contained"
                  >
                    Logout
                  </Button>
                </React.Fragment>
              )}

              <FormGroup>
                <div className={"filter__item"}>
                  <select
                    name="profile"
                    onChange={this.handleInputChange}
                    value={this.state.profile}
                  >
                    {this.state.profiles.map((profile) => (
                      <option key={profile} value={profile}>
                        {profile}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="profile">Profile</label>
                </div>
                {!this.state.editingProfile && (
                  <React.Fragment>
                    <Tooltip title="Add new profile">
                      <IconButton
                        aria-label="add-profile"
                        onClick={this.handleAddProfile}
                      >
                        <AddCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rename profile">
                      <IconButton
                        aria-label="rename-profile"
                        onClick={this.handleEditProfile}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>{" "}
                    <Tooltip title="Delete profile">
                      <IconButton
                        aria-label="delete-profile"
                        onClick={this.handleDeleteProfile}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>{" "}
                  </React.Fragment>
                )}

                {this.state.editingProfile && (
                  <React.Fragment>
                    <div className="filter__item">
                      <input
                        name="profileNameInput"
                        id="profileNameInput"
                        onChange={this.handleInputChange}
                        value={this.state.profileNameInput}
                        placeholder="Profile Name"
                      />
                      <label htmlFor="title">Profile Name</label>
                    </div>
                    <Button
                      onClick={this.handleSaveProfile}
                      variant="contained"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={this.handleCancelProfile}
                      variant="contained"
                    >
                      Cancel
                    </Button>
                  </React.Fragment>
                )}
              </FormGroup>
            </Paper>
          </div>
          )}
        </div>
        { ! this.state.screenshotMode && (
        <div className={"filter fullwidth mainfilter"}>
          <div className={"filter__item"}>
            <select
              title="Order by"
              name="orderBy"
              onChange={this.handleInputChange}
              value={this.state.orderBy}
            >
              <option value="number">Number</option>
              <option value="expiry">Expiry</option>
            </select>
            <label htmlFor="orderBy">Order By</label>
          </div>
          <div className="filter__item checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.sbcs}
                  name="sbcs"
                  id="sbcs"
                  onChange={this.handleCheckboxChange}
                />
              }
              label="SBCS"
            />
          </div>
          <div className="filter__item checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.objectives}
                  name="objectives"
                  id="objectives"
                  onChange={this.handleCheckboxChange}
                />
              }
              label="Objectives"
            />
          </div>
          <div className="filter__item checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.packs}
                  name="packs"
                  id="packs"
                  onChange={this.handleCheckboxChange}
                />
              }
              label="Packs"
            />
          </div>
          <div className="filter__item checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.unclaimedFilter}
                  name="unclaimedFilter"
                  id="unclaimedFilter"
                  onChange={this.handleCheckboxChange}
                />
              }
              label="Unclaimed"
            />
          </div>
          <div className="filter__item checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.claimedFilter}
                  name="claimedFilter"
                  id="claimedFilter"
                  onChange={this.handleCheckboxChange}
                />
              }
              label="Claimed"
            />
          </div>
          <div className="filter__item checkbox">
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.expiredFilter}
                  name="expiredFilter"
                  id="expiredFilter"
                  onChange={this.handleCheckboxChange}
                />
              }
              label="Expired"
            />
          </div>
        </div>
        )}

        <div id="tokens">
          {this.state.tokens.length > 0 &&
            sortedTokens.map((token) => {
              let tokenClassName = "token";
              if (token.claimed) {
                tokenClassName += " claimed";
              }
              if (token.expired) {
                tokenClassName += " expired";
              }
              return (
                <tooltip title={token.swap_hover}>
                <div
                  onClick={() => this.handleTokenClick(token.definitionId)}
                  key={token.definitionId}
                  className={tokenClassName}
                >
                  <img className="background" src={FutureToken} alt="Future Stars Token" />
                  {token.bestQualityImage === "futbin" && (
                    <img
                      className="avatar"
                      alt="Player Avatar"
                      src={
                        "https://static.wefut.com/assets/images/fut23/playeravatars/" +
                        token.playerId +
                        ".png"
                      }
                    />
                  )}
                  <div className="rating">{token.rating}</div>
                  <div className="mainPosition">{token.mainPosition}</div>
                  <img
                    className="nation"
                    alt="Nation Flag"
                    src={
                      "https://static.wefut.com/assets/images/nation_flag/" +
                      token.nationId +
                      ".jpg"
                    }
                  />
                  <img
                    className="club"
                    alt="Club Badge"
                    src={
                      "https://static.wefut.com/assets/images/fut23/clubbadges/" +
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
                </tooltip>
              );
            })}
        </div>
      </ThemeProvider>
    );
  }
}
export default App;
