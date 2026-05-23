import { User, Mail, Key, DollarSign, Award, Flag, Eye, EyeOff } from "lucide-react";

const AdminForm = ({
  handleSubmit,
  onSubmit,
  register,
  errors,
  editingAdmin,
  passwordVisible,
  setPasswordVisible,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {editingAdmin ? "Edit Admin" : "Add New Admin"}
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Enter name"
                {...register("fullName", { required: "Full name is required" })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150"
              />
            </div>
            {errors.fullName && (
              <span className="text-xs text-error-500 mt-1 block">{errors.fullName.message}</span>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Enter email"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" },
                })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-error-500 mt-1 block">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password {!editingAdmin && <span className="text-error-500">*</span>}
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <input
                placeholder={editingAdmin ? "Leave blank to keep" : "Enter password"}
                type={passwordVisible ? "text" : "password"}
                {...register("password", {
                  required: editingAdmin ? false : "Password is required",
                  minLength: { value: 8, message: "Min 8 characters" },
                })}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150"
              />
            </div>
            {errors.password && (
              <span className="text-xs text-error-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Number <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Enter account number"
                {...register("accountNumber", { required: "Account number is required" })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150"
              />
            </div>
            {errors.accountNumber && (
              <span className="text-xs text-error-500 mt-1 block">{errors.accountNumber.message}</span>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role <span className="text-error-500">*</span>
            </label>
            <div className="relative">
              <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                {...register("role", { required: "Role is required" })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150 appearance-none"
              >
                <option value="">Select role</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
            {errors.role && (
              <span className="text-xs text-error-500 mt-1 block">{errors.role.message}</span>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <div className="relative">
              <Flag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                {...register("state")}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150 appearance-none"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors duration-150 cursor-pointer"
          >
            {editingAdmin ? "Update Admin" : "Add Admin"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;
