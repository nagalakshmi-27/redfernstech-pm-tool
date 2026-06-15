import MainLayout from "../../layouts/MainLayout";

export default function Settings() {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Settings
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">

        <div>
          <label className="block font-medium mb-2">
            Full Name
          </label>
          <input
            type="text"
            defaultValue="Nagalakshmi"
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            defaultValue="nagalakshmi@redferns.com"
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Role
          </label>
          <input
            type="text"
            defaultValue="Frontend Developer"
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div className="pt-4 flex gap-3">

  <button
    className="bg-slate-900 text-white px-5 py-3 rounded-lg"
  >
    Save Changes
  </button>

  <button
    className="border px-5 py-3 rounded-lg"
  >
    Logout
  </button>

</div>

      </div>
    </MainLayout>
  );
}