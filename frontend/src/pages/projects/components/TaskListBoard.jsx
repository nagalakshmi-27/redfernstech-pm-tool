import { Trash2 } from "lucide-react";
import BulkTaskActions from "./BulkTaskActions";

export default function TaskListBoard({
  projectTasks,
  members,
  currentUserRole,
  handleDeleteTask,
  openTask,
  highlightedTaskId,
  selectedTasks,
  setSelectedTasks,
  selectModeColumn,
  setSelectModeColumn,
  activeColumn,
  setActiveColumn,
  showBulkMenu,
  setShowBulkMenu,
  handleDeleteSelectedTasks,
  handleAssignSelectedTasks,
  showAssignMemberModal,
  setShowAssignMemberModal,
  selectedMemberId,
  setSelectedMemberId,
  showChangePriorityModal,
  setShowChangePriorityModal,
  selectedPriority,
  setSelectedPriority,
  showMoveSelectedModal,
  setShowMoveSelectedModal,
  selectedStatus,
  setSelectedStatus,
  bulkMenuRef,
  showDeleteModal,
  setShowDeleteModal,
  bulkActionTaskIds,
  setBulkActionTaskIds,
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-white/10">

            <tr>
              {( (selectedTasks["all"] || []).length > 0 || selectModeColumn === "all" ) && (
                <th className="px-4 py-3 w-10"></th>
              )}
              <th className="px-4 py-3 text-left text-white">Ticket</th>
              <th className="px-4 py-3 text-left text-white">Task</th>
              <th className="px-4 py-3 text-left text-white">Priority</th>
              <th className="px-4 py-3 text-left text-white">Status</th>
              <th className="px-4 py-3 text-left text-white">Assignee</th>
              <th className="px-4 py-3 text-left text-white">Due Date</th>
              <th className="px-4 py-3 w-10 relative">
                <BulkTaskActions
                  isListBoard={true}
                  column="all"
                  selectedTasks={selectedTasks}
                  setSelectedTasks={setSelectedTasks}
                  selectModeColumn={selectModeColumn}
                  setSelectModeColumn={setSelectModeColumn}
                  projectTasks={projectTasks}
                  activeColumn={activeColumn}
                  setActiveColumn={setActiveColumn}
                  showBulkMenu={showBulkMenu}
                  setShowBulkMenu={setShowBulkMenu}
                  handleDeleteSelectedTasks={handleDeleteSelectedTasks}
                  handleAssignSelectedTasks={handleAssignSelectedTasks}
                  members={members}
                  showAssignMemberModal={showAssignMemberModal}
                  setShowAssignMemberModal={setShowAssignMemberModal}
                  selectedMemberId={selectedMemberId}
                  setSelectedMemberId={setSelectedMemberId}
                  showChangePriorityModal={showChangePriorityModal}
                  setShowChangePriorityModal={setShowChangePriorityModal}
                  selectedPriority={selectedPriority}
                  setSelectedPriority={setSelectedPriority}
                  showMoveSelectedModal={showMoveSelectedModal}
                  setShowMoveSelectedModal={setShowMoveSelectedModal}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  bulkMenuRef={bulkMenuRef}
                  showDeleteModal={showDeleteModal}
                  setShowDeleteModal={setShowDeleteModal}
                  bulkActionTaskIds={bulkActionTaskIds}
                  setBulkActionTaskIds={setBulkActionTaskIds}
                />
              </th>
            </tr>

          </thead>

          <tbody>

            {projectTasks.map((task) => {
              const assignee = members.find(
                (m) => m.id === task.assignee_id
              );

              return (
                <tr
                  key={task.id}
                  id={`task-card-${task.id}`}
                  onClick={() => openTask && openTask(task)}
                  className={`border-t border-white/10 hover:bg-white/5 transition cursor-pointer group ${highlightedTaskId === task.id ? 'bg-cyan-500/10 animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
                >
                  {( (selectedTasks["all"] || []).length > 0 || selectModeColumn === "all" ) && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={(selectedTasks["all"] || []).includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks(prev => ({
                              ...prev,
                              ["all"]: [...(prev["all"] || []), task.id]
                            }));
                          } else {
                            setSelectedTasks(prev => ({
                              ...prev,
                              ["all"]: (prev["all"] || []).filter(id => id !== task.id)
                            }));
                          }
                        }}
                        className="w-4 h-4 cursor-pointer accent-cyan-500"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-300">
                    {task.ticket_id || `TSK-${task.id}`}
                  </td>

                  <td className="px-4 py-3 text-white font-medium">
                    {task.name}
                  </td>

                  <td className="px-4 py-3">
                    {task.priority}
                  </td>

                  <td className="px-4 py-3">
                    {task.status}
                  </td>

                  <td className="px-4 py-3">
                    {assignee?.full_name ||
                      assignee?.name ||
                      "Unassigned"}
                  </td>

                  <td className="px-4 py-3 text-slate-300">
                    {task.due_date || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {currentUserRole !== "Client" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}