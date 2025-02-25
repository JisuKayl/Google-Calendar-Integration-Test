const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { google } = require("googleapis");
const mysql = require("mysql2/promise");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected");
    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error);
  }
})();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
      accessType: "offline",
      prompt: "consent",
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!accessToken) {
          throw new Error("No access token received");
        }

        refreshToken = refreshToken || null;

        const [rows] = await pool.execute(
          "SELECT * FROM users WHERE google_id = ?",
          [profile.id]
        );

        let user;

        if (rows.length === 0) {
          const [result] = await pool.execute(
            "INSERT INTO users (google_id, name, email, access_token, refresh_token) VALUES (?, ?, ?, ?, ?)",
            [
              profile.id,
              profile.displayName,
              profile.emails[0].value,
              accessToken,
              refreshToken,
            ]
          );

          user = {
            id: result.insertId,
            google_id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            access_token: accessToken,
            refresh_token: refreshToken,
          };
        } else {
          user = rows[0];
          await pool.execute(
            "UPDATE users SET access_token = ?, refresh_token = ? WHERE id = ?",
            [accessToken, refreshToken, user.id]
          );
          user.access_token = accessToken;
          user.refresh_token = refreshToken;
        }

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth Error:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return done(null, false);
    }
    done(null, rows[0]);
  } catch (error) {
    done(error);
  }
});

app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  })
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173");
  }
);

app.get("/api/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.get("/api/auth/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.json({ success: true });
  });
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};

const getCalendarClient = (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5000/api/auth/google/callback"
  );

  oauth2Client.setCredentials({
    access_token: user.access_token,
    refresh_token: user.refresh_token,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
};

app.get("/api/calendar/list", ensureAuthenticated, async (req, res) => {
  try {
    const calendar = getCalendarClient(req.user);
    const response = await calendar.calendarList.list();
    res.json(response.data.items);
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    res.status(500).json({ error: "Failed to fetch calendars" });
  }
});

app.get("/api/calendar/events", ensureAuthenticated, async (req, res) => {
  try {
    const calendar = getCalendarClient(req.user);
    const timeMin = req.query.timeMin || new Date().toISOString();
    const timeMax =
      req.query.timeMax ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post("/api/calendar/events", ensureAuthenticated, async (req, res) => {
  try {
    const calendar = getCalendarClient(req.user);
    const event = req.body;

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.delete(
  "/api/calendar/events/:eventId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const calendar = getCalendarClient(req.user);
      await calendar.events.delete({
        calendarId: "primary",
        eventId: req.params.eventId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  }
);

app.put(
  "/api/calendar/events/:eventId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const calendar = getCalendarClient(req.user);
      const event = req.body;

      const response = await calendar.events.update({
        calendarId: "primary",
        eventId: req.params.eventId,
        resource: event,
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
