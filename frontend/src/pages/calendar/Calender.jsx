import MainLayout from "../../layouts/MainLayout";
import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Calendar() {
  const [events, setEvents] = useState([
    {
  id: 1,
  title: "PM Tool Deadline",
  date: "2026-06-20",
  status: "Upcoming",
  category: "Deadline",
},
{
  id: 2,
  title: "Website Release",
  date: "2026-06-25",
  status: "Upcoming",
  category: "Release",
},
{
  id: 3,
  title: "Sprint Review",
  date: "2026-06-30",
  status: "Upcoming",
  category: "Sprint",
},
  ]);

  const [showModal, setShowModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState("Upcoming");
  const [eventCategory, setEventCategory] = useState("Meeting");
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddEvent = () => {
    if (!eventTitle.trim()) {
      alert("Event Title is required");
      return;
    }

    if (!eventDate) {
      alert("Event Date is required");
      return;
    }

    if (editingEventId) {
  const updatedEvents = events.map((event) =>
    event.id === editingEventId
      ? {
          ...event,
          title: eventTitle,
          date: eventDate,
          status: eventStatus,
          category: eventCategory,
        }
      : event
  );

  setEvents(updatedEvents);
} else {
  const newEvent = {
    id: Date.now(),
    title: eventTitle,
    date: eventDate,
    status: eventStatus,
    category: eventCategory,
  };

  setEvents([...events, newEvent]);
}

    setEventTitle("");
setEventDate("");
setEventStatus("Upcoming");
setEventCategory("Meeting");
setEditingEventId(null);
setShowModal(false);
  };

  const handleDeleteEvent = (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this event?"
  );

  if (!confirmDelete) {
    return;
  }

  const updatedEvents = events.filter(
    (event) => event.id !== id
  );

  setEvents(updatedEvents);
};

const handleEditEvent = (event) => {
  setEventTitle(event.title);
  setEventDate(event.date);
  setEventStatus(event.status);
  setEventCategory(event.category);
  setEditingEventId(event.id);
  setShowModal(true);
};

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
  setCurrentMonth(
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    )
  );

  setSelectedDate(null);
};

const nextMonth = () => {
  setCurrentMonth(
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    )
  );

  setSelectedDate(null);
};

const goToToday = () => {
  const today = new Date();

  setCurrentMonth(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  setSelectedDate(today.getDate());
};

  const totalEvents = events.length;

const upcomingEvents = events.filter(
  (event) => event.status === "Upcoming"
).length;

const completedEvents = events.filter(
  (event) => event.status === "Completed"
).length;

const cancelledEvents = events.filter(
  (event) => event.status === "Cancelled"
).length;

  const selectedEvents = events.filter((event) => {
  if (!selectedDate) return false;

  const eventDate = new Date(event.date);

  return (
    eventDate.getDate() === selectedDate &&
    eventDate.getMonth() === currentMonth.getMonth() &&
    eventDate.getFullYear() === currentMonth.getFullYear()
  );
});
const filteredEvents = selectedEvents.filter((event) =>
  event.title.toLowerCase().includes(searchTerm.toLowerCase())
);

  return (
    <MainLayout>
      <div className="flex justify-between items-start mb-6">
  <div>
    <h1 className="text-3xl font-bold">
      Calendar
    </h1>

    <p className="text-gray-500 mt-1">
      View project schedules and task deadlines
    </p>
  </div>

  <button
    onClick={() => setShowModal(true)}
    className="bg-slate-900 text-white px-4 py-2 rounded-lg"
  >
    + Add Event
  </button>
</div>
<div className="grid grid-cols-4 gap-4 mb-6">

  <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-all">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-sm">
        Total Events
      </p>

      <h2 className="text-2xl font-bold">
        {totalEvents}
      </h2>
    </div>

    <CalendarDays size={28} />
  </div>
</div>

  <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-all">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-sm">
        Upcoming
      </p>

      <h2 className="text-2xl font-bold text-blue-600">
        {upcomingEvents}
      </h2>
    </div>

    <Clock size={28} />
  </div>
</div>

  <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-all">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-sm">
        Completed
      </p>

      <h2 className="text-2xl font-bold text-green-600">
        {completedEvents}
      </h2>
    </div>

    <CheckCircle size={28} />
  </div>
</div>

  <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition-all">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-sm">
        Cancelled
      </p>

      <h2 className="text-2xl font-bold text-red-600">
        {cancelledEvents}
      </h2>
    </div>

    <XCircle size={28} />
  </div>
</div>
</div>

      <div className="grid grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
  <button
    onClick={prevMonth}
    className="px-4 py-2 bg-slate-100 rounded-lg"
  >
    ←
  </button>

  <div className="flex items-center gap-4">
    <h2 className="text-2xl font-bold">
      {monthNames[currentMonth.getMonth()]}{" "}
      {currentMonth.getFullYear()}
    </h2>
  </div>

  <button
    onClick={nextMonth}
    className="px-4 py-2 bg-slate-100 rounded-lg"
  >
    →
  </button>
</div>

          <div className="grid grid-cols-7 gap-2 text-center font-semibold mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(firstDay)].map((_, index) => (
              <div key={index}></div>
            ))}

            {[...Array(daysInMonth)].map((_, index) => {
  const day = index + 1;

  const eventCount = events.filter((event) => {
  const eventDate = new Date(event.date);

  return (
    eventDate.getDate() === day &&
    eventDate.getMonth() === currentMonth.getMonth() &&
    eventDate.getFullYear() === currentMonth.getFullYear()
  );
}).length;

  const isToday =
    new Date().getDate() === day &&
    new Date().getMonth() === currentMonth.getMonth() &&
    new Date().getFullYear() === currentMonth.getFullYear();
  const isPastDate =
  currentMonth.getFullYear() === new Date().getFullYear() &&
  currentMonth.getMonth() === new Date().getMonth() &&
  day < new Date().getDate();

  return (
    <div
      key={index}
      onClick={() => !isPastDate && setSelectedDate(day)}
      className={`h-25 border rounded-lg p-2 transition-all ${
  isPastDate
    ? "bg-gray-100 opacity-60 cursor-not-allowed"
    : "cursor-pointer hover:bg-blue-50 hover:shadow-md"
} ${
        selectedDate === day
          ? "bg-blue-100 border-blue-500 shadow-md"
          : isToday
          ? "border-green-500"
          : ""
      }`}
    >
      <div className="font-semibold text-gray-700">
  {day}
</div>

      <div className="flex flex-col gap-1 mt-2">
        {isToday && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 w-fit">
            Today
          </span>
        )}

        {eventCount > 0 && (
  <span
    className={`text-xs px-2 py-1 rounded-full w-fit ${
      events.some(
        (event) =>
          new Date(event.date).getDate() === day &&
          event.status === "Completed"
      )
        ? "bg-green-100 text-green-700"
        : events.some(
            (event) =>
              new Date(event.date).getDate() === day &&
              event.status === "Cancelled"
          )
        ? "bg-red-100 text-red-700"
        : "bg-blue-100 text-blue-700"
    }`}
  >
    {eventCount} Event{eventCount > 1 ? "s" : ""}
  </span>
)}
      </div>
    </div>
  );
})}
          </div>
        </div>

        {/* Events Panel */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold">
    {selectedDate
      ? `${monthNames[currentMonth.getMonth()]} ${selectedDate}, ${currentMonth.getFullYear()}`
      : "Select a Date"}
  </h2>

  <button
    onClick={goToToday}
    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
  >
    Today
  </button>
</div>

          {selectedDate ? (
            <>
              <h3 className="font-semibold mb-3">
                Events
              </h3>
              <input
  type="text"
  placeholder="Search events..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full border rounded-lg px-3 py-2 mb-3"
/>

              {filteredEvents.length > 0 ? (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
  const eventDateObj = new Date(event.date);

  const daysRemaining = Math.ceil(
  (eventDateObj.setHours(0,0,0,0) -
    new Date().setHours(0,0,0,0)) /
    (1000 * 60 * 60 * 24)
);

  return (
    <div
      key={event.id}
      className="bg-slate-100 p-3 rounded-lg"
    >
                      <div className="flex justify-between items-center">
  <p className="font-semibold">
    {event.title}
  </p>

  <span
  className={`px-2 py-1 text-xs font-semibold rounded-full ${
    event.category === "Deadline"
      ? "bg-red-100 text-red-700"
      : event.category === "Meeting"
      ? "bg-blue-100 text-blue-700"
      : event.category === "Sprint"
      ? "bg-purple-100 text-purple-700"
      : event.category === "Release"
      ? "bg-green-100 text-green-700"
      : "bg-orange-100 text-orange-700"
  }`}
>
  {event.category}
</span>

</div>

<p className="text-sm text-gray-500">
  Date: {event.date}
</p>
{daysRemaining > 0 && (
  <p className="text-sm text-orange-600 font-medium mt-1">
    ⏳ {daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining
  </p>
)}

{daysRemaining === 0 && (
  <p className="text-sm text-red-600 font-medium mt-1">
    🔥 Deadline Today
  </p>
)}

{daysRemaining < 0 && (
  <p className="text-sm text-red-600 font-medium mt-1">
    ⚠️ Overdue by {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) > 1 ? "s" : ""}
  </p>
)}
<span
  className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
    event.status === "Completed"
      ? "bg-green-100 text-green-700"
      : event.status === "Cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700"
  }`}
>
  {event.status}
</span>
<div className="flex gap-4 mt-2">
  <button
    onClick={() => handleEditEvent(event)}
    className="text-blue-600 text-sm font-medium"
  >
    Edit
  </button>

  <button
    onClick={() => handleDeleteEvent(event.id)}
    className="text-red-600 text-sm font-medium"
  >
    Delete
  </button>
</div>
                    </div>
  );
                                    })}
                </div>
              ) : (
                <p className="text-gray-500">
                  No events for this date.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">
              Click a date to view events.
            </p>
          )}
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <h2 className="text-2xl font-bold mb-4">
  {editingEventId ? "Update Event" : "Add Event"}
</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">
                  Event Title
                </label>

                <input
                  type="text"
                  placeholder="Enter Event Title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full border p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Event Date
                </label>

                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border p-3 rounded-lg"
                />
              </div>
              <div>
  <label className="block mb-2 font-medium">
    Status
  </label>

  <select
    value={eventStatus}
    onChange={(e) => setEventStatus(e.target.value)}
    className="w-full border p-3 rounded-lg"
  >
    <option>Upcoming</option>
    <option>Completed</option>
    <option>Cancelled</option>
  </select>
</div>
<div>
  <label className="block mb-2 font-medium">
    Category
  </label>

  <select
    value={eventCategory}
    onChange={(e) => setEventCategory(e.target.value)}
    className="w-full border p-3 rounded-lg"
  >
    <option>Meeting</option>
    <option>Deadline</option>
    <option>Sprint</option>
    <option>Release</option>
    <option>Review</option>
  </select>
</div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
  setShowModal(false);
  setEditingEventId(null);
  setEventTitle("");
  setEventDate("");
  setEventStatus("Upcoming");
  setEventCategory("Meeting");
}}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddEvent}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg"
                >
                  {editingEventId ? "Update Event" : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}