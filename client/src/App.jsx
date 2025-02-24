import React, { useState, useEffect } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [events, setEvents] = useState([]);
  const [calendarList, setCalendarList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
  });
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (view === "dashboard") {
        fetchCalendarList();
      } else if (view === "calendar") {
        fetchEvents();
      }
    }
  }, [isAuthenticated, view]);

  const checkAuthStatus = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/status", {
        withCredentials: true,
      });
      setIsAuthenticated(res.data.isAuthenticated);
      setUser(res.data.user);
      if (res.data.isAuthenticated) {
        setView("dashboard");
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarList = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/calendar/list",
        {
          withCredentials: true,
        }
      );
      setCalendarList(response.data);
    } catch (err) {
      console.error("Failed to fetch calendar list", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/calendar/events",
        {
          withCredentials: true,
        }
      );
      setEvents(
        response.data.map((event) => ({
          id: event.id,
          title: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          description: event.description || "",
          backgroundColor: event.colorId
            ? getEventColor(event.colorId)
            : "#3788d8",
        }))
      );
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  };

  const getEventColor = (colorId) => {
    const colors = {
      1: "#7986cb",
      2: "#33b679",
      3: "#8e24aa",
      4: "#e67c73",
      5: "#f6c026",
      6: "#f5511d",
      7: "#039be5",
      8: "#616161",
      9: "#3f51b5",
      10: "#0b8043",
      11: "#d60000",
    };
    return colors[colorId] || "#3788d8";
  };

  const handleDateClick = (info) => {
    setNewEvent({
      ...newEvent,
      start: info.dateStr,
      end: info.dateStr,
    });
    setShowEventForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const eventData = {
        summary: newEvent.title,
        description: newEvent.description,
        start: {
          dateTime: new Date(newEvent.start).toISOString(),
        },
        end: {
          dateTime: new Date(newEvent.end).toISOString(),
        },
      };

      await axios.post("http://localhost:5000/api/calendar/events", eventData, {
        withCredentials: true,
      });
      setShowEventForm(false);
      setNewEvent({ title: "", start: "", end: "", description: "" });
      fetchEvents();
    } catch (err) {
      console.error("Failed to create event", err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:5000/api/auth/logout", {
        withCredentials: true,
      });
      setIsAuthenticated(false);
      setUser(null);
      setView("home");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (view === "home") {
    return (
      <div className="container">
        <h1>Calendar Integration App</h1>
        <p>Integrate your Google Calendar seamlessly</p>

        {isAuthenticated ? (
          <button className="btn" onClick={() => setView("dashboard")}>
            Go to Dashboard
          </button>
        ) : (
          <button
            className="btn"
            onClick={() =>
              (window.location.href = "http://localhost:5000/api/auth/google")
            }
          >
            Sign in with Google
          </button>
        )}
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div className="container">
        <header className="header">
          <h1>Welcome, {user?.name}</h1>
          <div>
            <button className="btn" onClick={() => setView("home")}>
              Home
            </button>
            <button className="btn btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="calendar-section">
          <h2>Your Calendars</h2>
          {calendarList.length > 0 ? (
            <ul className="calendar-list">
              {calendarList.map((calendar) => (
                <li key={calendar.id}>
                  <span
                    className="calendar-item"
                    style={{ borderLeftColor: calendar.backgroundColor }}
                  >
                    {calendar.summary}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No calendars found.</p>
          )}
        </section>

        <button className="btn" onClick={() => setView("calendar")}>
          View Full Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Your Calendar</h1>
        <div>
          <button className="btn" onClick={() => setView("dashboard")}>
            Back to Dashboard
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          dateClick={handleDateClick}
          height="auto"
        />
      </div>

      {showEventForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Event</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date/Time</label>
                <input
                  type="datetime-local"
                  name="start"
                  value={newEvent.start}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date/Time</label>
                <input
                  type="datetime-local"
                  name="end"
                  value={newEvent.end}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn">
                  Save Event
                </button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowEventForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
