import MainLayout from "../../layouts/MainLayout";
import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  CheckSquare,
} from "lucide-react";

export default function Calendar() {
  const {
  tasks,
  members,
  projects,
  events: manualEvents,
  setEvents: setManualEvents,
} = useContext(AppContext);
  const currentUserId = members.find(m => m.email === localStorage.getItem("userEmail"))?.id;

  // 2. MAGICAL MERGE! Combine manual events and your real tasks into one giant calendar array!
  const events = [
    ...manualEvents,
    ...tasks
      .filter(task => task.assignee_id === currentUserId && task.due_date)
      .map(task => ({
  id: `task-${task.id}`,
  taskId: task.id,
  projectId: task.project_id,
  title: task.name,
  date: task.due_date,
  status: task.status,
  category: "Task",
  isTask: true
}))
  ];

  const isCompleted = (event) => {
  if (!event.isTask) {
    return event.status === "Completed";
  }

  const task = tasks.find((t) => `task-${t.id}` === event.id);

  return task?.status === "Completed";
};

  const [showModal, setShowModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState("Upcoming");
  const [eventCategory, setEventCategory] = useState("Meeting");
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCard, setActiveCard] = useState("date");
  const [showEventListModal, setShowEventListModal] = useState(false);
const [modalType, setModalType] = useState("all");
const eventDateRef = useRef(null);
const navigate = useNavigate();
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${editingEventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(eventData)
      });
      if (response.ok) {
        const updatedEvent = await response.json();
        setManualEvents(manualEvents.map(e => e.id === editingEventId ? updatedEvent : e));
      } else {
        alert("Failed to update event.");
      }
    } else {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/`, {
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`, {
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`, {
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
    (
      event.isTask
  ? !isCompleted(event)
  : event.status === "Upcoming"
    ) &&
    daysRemaining >= 0
  );
}).length;

const completedTasks = events.filter(
  (event) => isCompleted(event)
).length;

const missedTasks = events.filter((event) => {
  const daysRemaining = Math.ceil(
    (new Date(event.date).setHours(0, 0, 0, 0) -
      new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  return (
  daysRemaining < 0 &&
  !isCompleted(event) &&
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
const cardFilteredEvents = (() => {
  switch (activeCard) {
    case "pending":
  return selectedEvents.filter((event) =>
    event.isTask
      ? !isCompleted(event)
      : event.status === "Upcoming"
  );
    case "completed":
  return selectedEvents.filter(
    (event) => isCompleted(event)
  );

    case "missed":
      return selectedEvents.filter((event) => {
        const daysRemaining = Math.ceil(
          (new Date(event.date).setHours(0, 0, 0, 0) -
            new Date().setHours(0, 0, 0, 0)) /
            (1000 * 60 * 60 * 24)
        );

        return (
  daysRemaining < 0 &&
  !isCompleted(event) &&
  event.status !== "Cancelled"
);
      });

    default:
      return selectedEvents;
  }
})();

const filteredEvents = cardFilteredEvents.filter((event) =>
  event.title.toLowerCase().includes(searchTerm.toLowerCase())
);

const allFilteredEvents = (() => {
  let list = [...events];

  switch (activeCard) {
    case "pending":
      list = list.filter((event) => event.status === "Upcoming");
      break;

    case "completed":
      list = list.filter((event) => event.status === "Completed");
      break;

    case "missed":
      list = list.filter((event) => {
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
      });
      break;

    default:
      break;
  }

  return list.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
})();

const modalEvents = (() => {
  switch (modalType) {
    case "pending":
  return events.filter((event) =>
    event.isTask
      ? !isCompleted(event)
      : event.status === "Upcoming"
  );
    case "completed":
  return events.filter((event) => isCompleted(event));

    case "missed":
  return events.filter((event) => {
    const daysRemaining = Math.ceil(
      (new Date(event.date).setHours(0, 0, 0, 0) -
        new Date().setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    );

    return (
      daysRemaining < 0 &&
      (
        event.isTask
  ? !isCompleted(event)
  : event.status !== "Completed" &&
    event.status !== "Cancelled"
      )
    );
  });

    default:
      return events;
  }
})();

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-white">
      Calendar
    </h1>

    <p className="text-slate-400 mt-1">
      View project schedules and task deadlines
    </p>
  </div>

  <button
    onClick={() => setShowModal(true)}
    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all"
  >
    + Add Event
  </button>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <div
  onClick={() => {
  setModalType("all");
  setShowEventListModal(true);
}}
  className={`cursor-pointer bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-cyan-500 transition-all duration-300 hover:scale-[1.02] ${
    activeCard === "all" ? "ring-2 ring-cyan-400" : ""
  }`}
>
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
    <div>
      <p className="text-slate-400 text-base font-medium">
        Total Events
      </p>

      <p className="text-3xl font-bold mt-2 text-white">
        {totalEvents}
      </p>
    </div>

    <CalendarDays size={22} className="text-cyan-400" />
  </div>
</div>

  <div
  onClick={() => {
  setModalType("pending");
  setShowEventListModal(true);
}}
  className={`cursor-pointer bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-yellow-400 transition-all duration-300 hover:scale-[1.02] ${
    activeCard === "pending" ? "ring-2 ring-yellow-400" : ""
  }`}
>
  <div className="flex justify-between items-center">
    <div>
      <p className="text-slate-400 text-base font-medium">
        Pending
      </p>

      <p className="text-3xl font-bold mt-2 text-white">
        {pendingTasks}
      </p>
    </div>

    <Clock size={22} className="text-yellow-400" />
  </div>
</div>

  <div
  onClick={() => {
  setModalType("completed");
  setShowEventListModal(true);
}}
  className={`cursor-pointer bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-green-400 transition-all duration-300 hover:scale-[1.02] ${
    activeCard === "completed" ? "ring-2 ring-green-400" : ""
  }`}
>
  <div className="flex justify-between items-center">
    <div>
      <p className="text-slate-400 text-base font-medium">
        Completed
      </p>

      <p className="text-3xl font-bold mt-2 text-white">
        {completedTasks}
      </p>
    </div>

    <CheckCircle size={22} className="text-green-400" />
  </div>
</div>

  <div
  onClick={() => {
  setModalType("missed");
  setShowEventListModal(true);
}}
  className={`cursor-pointer bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-red-400 transition-all duration-300 hover:scale-[1.02] ${
    activeCard === "missed" ? "ring-2 ring-red-400" : ""
  }`}
>
  <div className="flex justify-between items-center">
    <div>
      <p className="text-slate-400 text-base font-medium">
        Missed
      </p>

      <p className="text-3xl font-bold mt-2 text-white">
        {missedTasks}
      </p>
      
    </div>
    

    <XCircle size={22} className="text-red-400" />
  </div>
</div>
</div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="xl:col-span-2 bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-4 md:p-6 overflow-x-auto">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
  <button
    onClick={prevMonth}
    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
  >
    ←
  </button>

  <div className="flex items-center gap-4">
    <h2 className="text-lg md:text-2xl font-bold text-center text-white">
      {monthNames[currentMonth.getMonth()]}{" "}
      {currentMonth.getFullYear()}
    </h2>
  </div>

  <button
    onClick={nextMonth}
    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
  >
    →
  </button>
</div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-semibold text-xs md:text-base mb-2 min-w-[650px] text-slate-300">
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
  ? "bg-white/5 border-white/5 opacity-50 cursor-pointer text-slate-400"
  : "bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 hover:border-cyan-400/50"
} ${
        selectedDate === day
          ? "bg-white/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          : isToday
? "border-cyan-400 bg-white/10"
          : ""
      }`}
    >
      <div className="font-semibold text-slate-200">
  {day}
</div>

      <div className="flex flex-col gap-1 mt-2">
        {isToday && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 w-fit">
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

  const pendingCount = dayEvents.filter((event) => !isCompleted(event)).length;

  const isPastDeadline =
    new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).setHours(0, 0, 0, 0) <
    new Date().setHours(0, 0, 0, 0);

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full w-fit border ${
  isPastDeadline && pendingCount > 0
    ? "bg-red-500/20 text-red-300 border-red-500/30"
    : pendingCount === 0
    ? "bg-green-500/20 text-green-300 border-green-500/30"
    : pendingCount > 0
    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
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
        <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-4 md:p-6 text-white">
          <div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold text-white">
    {selectedDate
      ? `${monthNames[currentMonth.getMonth()]} ${selectedDate}, ${currentMonth.getFullYear()}`
      : "Select a Date"}
  </h2>

  <button
    onClick={goToToday}
    className="px-3 py-1 bg-white/10 text-cyan-400 rounded-lg text-sm font-medium hover:bg-white/20 border border-white/10 transition"
  >
    Today
  </button>
</div>

          {selectedDate ? (
            <>
              <h3 className="font-semibold mb-3 text-slate-200">
                Events
              </h3>
              <input
  type="text"
  placeholder="Search events..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 px-3 py-2 mb-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
  onClick={() => {
  if (event.isTask) {
    navigate(
      `/projects/${event.projectId}?highlightTask=${event.taskId}`
    );
    return;
  }

  const date = new Date(event.date);

  setCurrentMonth(
    new Date(date.getFullYear(), date.getMonth(), 1)
  );

  setSelectedDate(date.getDate());
}}
  className="bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer hover:border-cyan-400 hover:bg-white/10 transition"
>
                      <div className="flex justify-between items-center">
  <p className="font-semibold text-white">
    {event.title}
  </p>

  <div className="flex flex-wrap items-center gap-3">

  <div
    className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${
      event.isTask
        ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
    }`}
  >
    {event.isTask ? (
      <>
        <CheckSquare size={14} />
        <span>Task</span>
      </>
    ) : (
      <>
        <CalendarDays size={14} />
        <span>Event</span>
      </>
    )}
  </div>

  {!event.isTask && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggleEventStatus(event.id, event.status);
    }}
    className={`relative w-10 h-5 rounded-full transition-all ${
      event.status === "Completed"
        ? "bg-green-500"
        : "bg-white/20"
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
)}
</div>

</div>

<p className="text-sm text-slate-400">
  Date: {event.date}
</p>
{daysRemaining > 0 && (
  <p className="text-sm text-yellow-400 font-medium mt-1">
    ⏳ {daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining
  </p>
)}

{daysRemaining === 0 && (
  <p className="text-sm text-red-400 font-medium mt-1">
    🔥 Deadline Today
  </p>
)}

{isMissed && (
  <p className="text-sm text-yellow-400 font-medium mt-1">
    ⚠️ Missed Deadline • {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) > 1 ? "s" : ""} overdue
  </p>
)}
<span
  className={`inline-block px-2 py-1 text-xs rounded-full mt-2 font-bold border ${
    isMissed
      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      : event.status === "Completed"
      ? "bg-green-500/20 text-green-300 border-green-500/30"
      : event.status === "Cancelled"
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
  }`}
>
  {isMissed ? "Missed" : event.status}
</span>
{!event.isTask && (
  <div className="flex flex-wrap gap-4 mt-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleEditEvent(event);
      }}
      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
    >
      Edit
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteEvent(event.id);
      }}
      className="text-red-400 hover:text-red-300 text-sm font-medium transition"
    >
      Delete
    </button>
  </div>
)}
                    </div>
  );
                                    })}
                </div>
              ) : (
                <p className="text-slate-400">
                  No events for this date.
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-400">
              Click a date to view events.
            </p>
          )}
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-2xl w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold mb-4 text-white">
  {editingEventId ? "Update Event" : "Add Event"}
</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-slate-300">
                  Event Title
                </label>

                <input
                  type="text"
                  placeholder="Enter Event Title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
  <label className="block mb-2 font-medium text-slate-300">
    Event Date
  </label>

  <div className="relative">
    <input
      ref={eventDateRef}
      type="date"
      value={eventDate}
      min={new Date().toISOString().split("T")[0]}
      max="9999-12-31"
      onChange={(e) => setEventDate(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white p-3 pr-12 rounded-lg focus:outline-none focus:border-cyan-500 appearance-none [color-scheme:dark]"
    />

    <CalendarIcon
  size={18}
  onClick={() => eventDateRef.current?.showPicker()}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer z-20"
/>
  </div>
</div>
              <div>
  <label className="block mb-2 font-medium text-slate-300">
    Status
  </label>

  <select
  value={eventStatus}
  onChange={(e) => setEventStatus(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
>
  <option className="bg-slate-900">Upcoming</option>
  <option className="bg-slate-900">Completed</option>
  <option className="bg-slate-900">Cancelled</option>
</select>
</div>
<div>
  <label className="block mb-2 font-medium text-slate-300">
    Category
  </label>

  <select
    value={eventCategory}
    onChange={(e) => setEventCategory(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
  >
    <option className="bg-slate-900">Meeting</option>
    <option className="bg-slate-900">Deadline</option>
    <option className="bg-slate-900">Sprint</option>
    <option className="bg-slate-900">Release</option>
    <option className="bg-slate-900">Review</option>
  </select>
</div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={() => {
  setShowModal(false);
  setEditingEventId(null);
  setEventTitle("");
  setEventDate("");
  setEventStatus("Upcoming");
  setEventCategory("Meeting");
}}
                  className="px-4 py-2 border border-white/20 text-slate-300 rounded-lg hover:bg-white/5 transition w-full sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddEvent}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all"
                >
                  {editingEventId ? "Update Event" : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEventListModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-slate-900 border border-white/10 rounded-2xl w-[90%] max-w-2xl p-6">

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-white">
          {modalType === "all" && "Total Events"}
          {modalType === "pending" && "Pending Events"}
          {modalType === "completed" && "Completed Events"}
          {modalType === "missed" && "Missed Events"}
        </h2>

        <button
          onClick={() => setShowEventListModal(false)}
          className="text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
  {modalEvents.length > 0 ? (
    modalEvents.map((event) => (
      <div
        key={event.id}
        onClick={() => {
          const date = new Date(event.date);

          setCurrentMonth(
            new Date(date.getFullYear(), date.getMonth(), 1)
          );

          setSelectedDate(date.getDate());

          setShowEventListModal(false);
        }}
        className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-cyan-400 hover:bg-white/10 transition"
      >
        <div>
  <div className="flex items-center gap-2 flex-wrap">
    <h3 className="font-semibold text-white">
      {event.title}
    </h3>

    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${
        event.isTask
          ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
          : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
      }`}
    >
      {event.isTask ? (
        <>
          <CheckSquare size={14} />
          <span>Task</span>
        </>
      ) : (
        <>
          <CalendarDays size={14} />
          <span>Event</span>
        </>
      )}
    </div>
  </div>

  <p className="text-sm text-slate-400 mt-2">
    Status: {event.status}
  </p>
</div>
      </div>
    ))
  ) : (
    <p className="text-slate-400 text-center py-6">
      No events found.
    </p>
  )}
</div>

    </div>
  </div>
)}
    </MainLayout>
  );
}