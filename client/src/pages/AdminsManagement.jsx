import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import BaseHeader from "../ui/common/BaseHeader";
import BaseTable from "../ui/common/BaseTable";
import StatusBadge from "../ui/common/StatusBadge";
import SearchFilterBar from "../ui/common/SearchFilterBar";
import PageContainer from "../ui/common/PageContainer";
import Button from "../ui/common/Button";
import { useToast } from "../ui/common/Toast";
import AdminForm from "../ui/Admins Management/AdminForm";
import ConfirmationDialog from "../ui/Admins Management/ConfirmationDialog";
import { Trash2, Pencil, UserPlus } from "lucide-react";
import { formatDate } from "../lib/formatDate";
import { useAdmins } from "../hooks/useApi";
import { api } from "../lib/api";

const columns = [
  { header: "#", accessor: "id" },
  { header: "Name", accessor: "name" },
  { header: "Email", accessor: "email" },
  { header: "Role", accessor: "role" },
  { header: "Status", accessor: "status" },
  { header: "Created", accessor: "createdAt" },
  { header: "", accessor: "actions" },
];

const headerRow = (
  <tr>
    {columns.map((col) => (
      <th key={col.accessor} className="px-5 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase text-left">
        {col.header}
      </th>
    ))}
  </tr>
);

const AdminsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(searchQuery && { search: searchQuery }),
  };
  const { data: admins, loading, refetch } = useAdmins(filters);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { fullName: "", email: "", password: "", accountNumber: "", role: "", state: "Active" },
  });

  const onSubmit = async (data) => {
    try {
      if (editingAdmin) {
        const body = {
          full_name: data.fullName,
          email: data.email,
          role: data.role,
          status: data.state,
          account_number: data.accountNumber,
        };
        if (data.password) body.password = data.password;
        await api.put(`/admins/${editingAdmin.id}`, body);
        toast.success(`${data.fullName} updated successfully.`);
      } else {
        const body = {
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
          status: data.state,
          account_number: data.accountNumber,
        };
        await api.post("/admins", body);
        toast.success(`${data.fullName} added as admin.`);
      }
      refetch();
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    }
    setShowForm(false);
    setEditingAdmin(null);
    reset();
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    reset({
      fullName: admin.full_name,
      email: admin.email,
      password: "",
      accountNumber: admin.account_number || "",
      role: admin.role,
      state: admin.status,
    });
    setShowForm(true);
    setPasswordVisible(false);
  };

  const handleDelete = (adminId) => {
    setAdminToDelete(adminId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const deletedName = (admins || []).find((a) => a.id === adminToDelete)?.full_name || "Admin";
    try {
      await api.delete(`/admins/${adminToDelete}`);
      toast.success(`${deletedName} removed.`);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to delete admin.");
    }
    setConfirmOpen(false);
    setAdminToDelete(null);
  };

  const handleAddAdminClick = () => {
    if (showForm) {
      setEditingAdmin(null);
      reset();
      setPasswordVisible(false);
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  const adminsList = admins || [];
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(adminsList.length / pageSize));

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  const renderRow = (admin, index) => (
    <tr key={admin.id || index} className="hover:bg-gray-50 transition-colors duration-100">
      <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{admin.id}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{admin.full_name}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{admin.email}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{admin.role}</td>
      <td className="px-5 py-3.5"><StatusBadge status={admin.status} /></td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(admin.created_at)}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(admin)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors duration-100 cursor-pointer"
            aria-label="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(admin.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 transition-colors duration-100 cursor-pointer"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <PageContainer>
      <BaseHeader
        title="Admins Management"
        subtitle="Manage system administrators and their permissions"
        actions={
          <Button onClick={handleAddAdminClick}>
            <UserPlus size={16} className="mr-2" />
            {showForm ? "Hide Form" : "Add Admin"}
          </Button>
        }
      />

      <div className="mt-6">
        <SearchFilterBar
          searchPlaceholder="Search admins..."
          filterOptions={["Active", "Suspended"]}
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {showForm && (
        <div className="mt-5">
          <AdminForm
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            register={register}
            errors={errors}
            editingAdmin={editingAdmin}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
          />
        </div>
      )}

      <div className="mt-5">
        <BaseTable
          data={adminsList}
          header={headerRow}
          colCount={columns.length}
          rowRenderer={renderRow}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)))}
          showPagination={true}
          isLoading={loading}
          emptyMessage={searchQuery || statusFilter ? "No admins match your filters." : "No admins yet."}
          emptyActionLabel={searchQuery || statusFilter ? "Clear filters" : undefined}
          onEmptyAction={() => { setSearchQuery(""); setStatusFilter(null); }}
        />
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Admin"
        message="Are you sure you want to delete this admin? This action cannot be undone."
      />
    </PageContainer>
  );
};

export default AdminsManagement;
