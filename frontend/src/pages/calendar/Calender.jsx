import MainLayout from "../../layouts/MainLayout";
import { useState, useEffect, useContext } from "react";
import AppContext from "../../context/AppContext";
import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";

export default function Calendar() {
  const { tasks, members } = useContext(AppContext);
  const currentUserId = members.find(m => m.email === localStorage.getItem("userEmail"))?.id;
  const [manualEvents, setManualEvents] = useState([]); // This stores events from your DB

  // 1. Fetch your events from the database when the page loads!
  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/events/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setManualEvents(await response.json());
      }
    };
    fetchEvents();
  }, []);

  // 2. MAGICAL MERGE! Combine manual events and your real tasks into one giant calendar array!
  const events = [
    ...manualEvents,
    ...tasks
      .filter(task => task.assignee_id === currentUserId)
      .map(task => ({
      id: `task-${task.id}`, // Add a prefix so it doesn't conflict with event IDs
      title: task.name,
      date: task.due_date,
      status: task.status === "Completed" ? "Completed" : "Upcoming",
      category: "Task", // Label it specifically as a task!
      isTask: true      // Flag it so we know it's not a manual event
    }))
  ];

  const [showModal, setShowModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState("Upcoming");
  const [eventCategory, setEventCategory] = useState("Meeting");
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) {
      alert("Event Title is required");
      return;
    }

    if (!eventDate) {
      alert("Event Date is required");
      return;
    }

    const selectedEventDate = new Date(eventDate);
    selectedEventDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!editingEventId && selectedEventDate < today) {
      alert("Cannot create events for past dates");
      return;
    }

    const token = localStorage.getItem("token");
    const eventData = {
      title: eventTitle,
      date: eventDate,
      type: eventCategory,
      status: eventStatus
    };

    if (editingEventId) {
      alert("Editing manual events is not yet supported by the backend!");
    } else {
      const response = await fetch("http://127.0.0.1:8000/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(eventData)
      });
      if (response.ok) {
        const newEvent = await response.json();
        setManualEvents([...manualEvents, newEvent]); 
      }
    }

    setEventTitle("");
    setEventDate("");
    setEventStatus("Upcoming");
    setEventCategory("Meeting");
    setEditingEventId(null);
    setShowModal(false);
  };
    const handleDeleteEvent = async (id) => {
    // Prevent deleting Tasks from the Calendar screen
    if (typeof id === 'string' && id.startsWith('task-')) {
      alert("You can only delete tasks from the Tasks page!");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this event?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    const response = await fetch(`http://127.0.0.1:8000/events/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
      setManualEvents(manualEvents.filter((event) => event.id !== id));
    }
  };
const handleEditEvent = (event) => {
  if (event.isTask) {
    alert("Please go to the Tasks page to edit tasks!");
    return;
  }
  setEventTitle(event.title);
  setEventDate(event.date);
  setEventStatus(event.status);
  setEventCategory(event.category || event.type);
  setEditingEventId(event.id);
  setShowModal(true);
};
  const toggleEventStatus = async (id, currentStatus) => {
    if (typeof id === 'string' && id.startsWith('task-')) {
      alert("Please change task status from the Tasks page!");
      return;
    }

    const newStatus = currentStatus === "Completed" ? "Upcoming" : "Completed";
    
    const token = localStorage.getItem("token");
    const response = await fetch(`http://127.0.0.1:8000/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      const updatedEvent = await response.json();
      setManualEvents(manualEvents.map(e => e.id === id ? updatedEvent : e));
    } else {
      alert("Failed to update status");
    }
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

  

const pendingTasks = events.filter((event) => {
  const daysRemaining = Math.ceil(
    (new Date(event.date).setHours(0, 0, 0, 0) -
      new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  return (
    event.status === "Upcoming" &&
    daysRemaining >= 0
  );
}).length;

const completedTasks = events.filter(
  (event) => event.status === "Completed"
).length;

const missedTasks = events.filter((event) => {
  const daysRemaining = Math.ceil(
    (new Date(event.date).setHours(0, 0, 0, 0) -
      new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  return (
    daysRemaining < 0 &&
    event.status !== "Completed" &&
    event.status !== "Cancelled"
  );
}).length;

const cancelledTasks = events.filter(
  (event) => event.status === "Cancelled"
).length;

const totalEvents =
  events.length -
  missedTasks -
  cancelledTasks;

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
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold">
      Calendar
    </h1>

    <p className="text-gray-500 mt-1">
      View project schedules and task deadlines
    </p>
  </div>

  <button
    onClick={() => setShowModal(true)}
    className="bg-slate-900 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
  >
    + Add Event
  </button>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
    <div>
      <p className="text-gray-500 text-base font-medium">
        Total Events
      </p>

      <p className="text-3xl font-bold mt-2">
        {totalEvents}
      </p>
    </div>

    <CalendarDays size={22} />
  </div>
</div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-base font-medium">
        Pending
      </p>

      <p className="text-3xl font-bold mt-2">
        {pendingTasks}
      </p>
    </div>

    <Clock size={22} />
  </div>
</div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-base font-medium">
        Completed
      </p>

      <p className="text-3xl font-bold mt-2">
        {completedTasks}
      </p>
    </div>

    <CheckCircle size={22} />
  </div>
</div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-base font-medium">
        Missed
      </p>

      <p className="text-3xl font-bold mt-2">
        {missedTasks}
      </p>
      
    </div>
    

    <XCircle size={22} />
  </div>
</div>
</div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow p-4 md:p-6 overflow-x-auto">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
  <button
    onClick={prevMonth}
    className="px-4 py-2 bg-slate-100 rounded-lg"
  >
    ←
  </button>

  <div className="flex items-center gap-4">
    <h2 className="text-lg md:text-2xl font-bold text-center">
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

          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-semibold text-xs md:text-base mb-2 min-w-[650px]">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[650px]">
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
      onClick={() => setSelectedDate(day)}
      className={`min-h-[90px] md:min-h-[110px] border rounded-lg p-1 md:p-2 transition-all ${
  isPastDate
  ? "bg-gray-100 opacity-60 cursor-pointer"
  : "cursor-pointer hover:bg-blue-50 hover:shadow-md"
} ${
        selectedDate === day
          ? "bg-blue-100 border-blue-500 shadow-md"
          : isToday
? "border-blue-500 bg-blue-50"
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

        {eventCount > 0 && (() => {
  const dayEvents = events.filter((event) => {
    const eventDate = new Date(event.date);

    return (
      eventDate.getDate() === day &&
      eventDate.getMonth() === currentMonth.getMonth() &&
      eventDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const pendingCount = dayEvents.filter(
  (event) => event.status === "Upcoming"
).length;

  const isPastDeadline =
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).setHours(0, 0, 0, 0) <
    new Date().setHours(0, 0, 0, 0);

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full w-fit ${
  isPastDeadline && pendingCount > 0
    ? "bg-red-100 text-red-800"
    : pendingCount === 0
    ? "bg-green-100 text-green-700"
    : pendingCount > 0
    ? "bg-yellow-100 text-yellow-800"
    : "bg-blue-100 text-blue-700"
}`}
    >
      {isPastDeadline && pendingCount > 0
  ? "Missed"
  : pendingCount === 0
  ? "Completed"
  : `${pendingCount} Pending`}
    </span>
  );
})()}
      </div>
    </div>
  );
})}
          </div>
        </div>

        {/* Events Panel */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
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
const isMissed =
  daysRemaining < 0 &&
  event.status !== "Completed" &&
  event.status !== "Cancelled";
  return (
    <div
      key={event.id}
      className="bg-slate-100 p-3 rounded-lg"
    >
                      <div className="flex justify-between items-center">
  <p className="font-semibold">
    {event.title}
  </p>

  <div className="flex flex-wrap items-center gap-3">
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

  <button
    onClick={() => toggleEventStatus(event.id, event.status)}
    className={`relative w-10 h-5 rounded-full transition-all ${
      event.status === "Completed"
        ? "bg-green-500"
        : "bg-gray-300"
    }`}
  >
    <span
      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
        event.status === "Completed"
          ? "right-0.5"
          : "left-0.5"
      }`}
    />
  </button>
</div>

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

{isMissed && (
  <p className="text-sm text-orange-600 font-medium mt-1">
    ⚠️ Missed Deadline • {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) > 1 ? "s" : ""} overdue
  </p>
)}
<span
  className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
    isMissed
      ? "bg-orange-100 text-orange-700"
      : event.status === "Completed"
      ? "bg-green-100 text-green-700"
      : event.status === "Cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700"
  }`}
>
  {isMissed ? "Missed" : event.status}
</span>
<div className="flex flex-wrap gap-4 mt-2">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 md:p-6 rounded-xl w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto">
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
  min={new Date().toISOString().split("T")[0]}
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

              <div className="flex flex-col sm:flex-row justify-end gap-3">
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