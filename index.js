import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import env from "dotenv";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Session Middleware Setup:
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{                      //set session expiry
    maxAge: 1000 * 60 * 60 *24, //one day length cookie
  },
}));

//Passport Middleware Setup:
app.use(passport.initialize());
app.use(passport.session());

//DB 
const { Pool } = pg;
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { errorMessage: null }); 
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

//Secrets Route:Checks if the user is authenticated using Passport's isAuthenticated() method.
app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {  //Checks if the user is authenticated.
    try {                       //retrieve all secrets from the secrets_text table.
      const result = await db.query("SELECT id, secret FROM secrets_text");
      const secrets = result.rows;  // Keep the structure as {id, secret}
      res.render("secrets.ejs", { secrets: secrets });  // Passes the secrets array to the secrets.ejs template for rendering.
    } catch (err) {
      console.log(err);
    }
  } else {
    res.redirect("/login");
  }
});

//SUBMIT GET ROUTE
app.get("/submit", (req, res)=>{
  if (req.isAuthenticated()){
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get("/auth/google", 
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req,res)=>{
  req.logout((err)=>{
    if(err) console.log(err);
    res.redirect("/");
  })
});

//Delete secret route
app.post("/delete-secret", async (req, res) => {
  if (req.isAuthenticated()) {
      const secretId = req.body.secretId;
      try {
          await db.query("DELETE FROM secrets_text WHERE id = $1", [secretId]);
          res.redirect("/secrets");
      } catch (err) {
          console.log(err);
          res.redirect("/secrets");
      }
  } else {
      res.redirect("/login");
  }
});

//SUBMIT POST ROUTE
app.post("/submit", async (req, res) => {
  const secret = req.body.secret;
  try {   //Inserts the new secret into the secrets_text table with the current user's ID.
    await db.query("INSERT INTO secrets_text (secret, user_id) VALUES ($1, $2)", [secret, req.user.id]);
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});


// Login POST Route: Handles the login form submission using Passport's local strategy.
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render("login.ejs", { errorMessage: "Incorrect password" });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/secrets");
    });
  })(req, res, next);
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  
  try {
    const checkResult = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkResult.rows.length > 0){
      res.redirect("/login");
    } else {
      //hashing the password and saving it in the database
      bcrypt.hash(password, saltRounds, async(err, hash)=>{
        if(err){
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
          "INSERT INTO users (email, password) VALUES ($1,$2) RETURNING *",
          [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err)=>{
            console.log(err);
            res.redirect("/secrets");
          });
        }
      }); 
    } 
  } catch (err) {
    console.log(err);
  } 
});

//Passport Local Strategy Setup:Defines a new Passport local strategy for authenticating users.The strategy's verify function with the provided username and password as named inside login form.
//It queries the database to find the user by email and compares the hashed password.
passport.use("local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {  //valid = true, valid is boolean
              //Passed password check
              return cb(null, user); //null (to indicate that there's no error) and data want to store:user
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

//google is the name of the strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      // console.log(profile);
      try {
       const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email]);
       if (result.rows.length === 0) { //user is new and we add them.
        const newUser = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2)",
          [profile.email, "google"]
        );
        return cb(null, newUser.rows[0]);
      } else {                        //user already exists
        return cb(null, result.rows[0]);
      }
    } catch (err) {
       return cb(err);
    }
  }
)
);

//The passport.serializeUser and passport.deserializeUser functions are crucial for maintaining user authentication sessions in an Express application using Passport.js.
//These functions handle how user information is stored in the session and retrieved from it.
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

//retrieve the user object from the database based on the user ID stored in the session.
passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = result.rows[0];
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
