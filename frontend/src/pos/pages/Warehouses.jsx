import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Warehouse,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  StickyNote,
  User,
  Flag,
  Hash,
  Layers,
  CheckCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} from '../store/services/warehousesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LoadingPage,
  LoadingCard,
  LoadingSpinner,
  LoadingButton,
} from '../components/LoadingSpinner';
import { DeleteConfirmationDialog } from '../components/ConfirmationDialog';
import { useDeleteConfirmation } from '../hooks/useConfirmation';

const defaultFormValues = {
  name: '',
  code: '',
  description: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  contact: {
    name: '',
    phone: '',
    email: '',
  },
  capacity: '',
  isPrimary: false,
  isActive: true,
  notes: '',
};

const sanitizePayload = (payload) => {
  const sanitized = { ...payload };

  sanitized.code = sanitized.code?.trim().toUpperCase();
  sanitized.name = sanitized.name?.trim();
  sanitized.description = sanitized.description?.trim() || undefined;
  sanitized.notes = sanitized.notes?.trim() || undefined;

  if (sanitized.capacity === '' || sanitized.capacity === null) {
    delete sanitized.capacity;
  } else {
    sanitized.capacity = Number(sanitized.capacity);
  }

  if (sanitized.address) {
    const cleanedAddress = Object.fromEntries(
      Object.entries(sanitized.address).map(([key, value]) => [key, value?.trim() || undefined])
    );
    if (Object.values(cleanedAddress).every((value) => !value)) {
      delete sanitized.address;
    } else {
      sanitized.address = cleanedAddress;
    }
  }

  if (sanitized.contact) {
    const cleanedContact = Object.fromEntries(
      Object.entries(sanitized.contact).map(([key, value]) => [key, value?.trim() || undefined])
    );
    if (Object.values(cleanedContact).every((value) => !value)) {
      delete sanitized.contact;
    } else {
      sanitized.contact = cleanedContact;
    }
  }

  return sanitized;
};

import BaseModal from '../components/BaseModal';

const WarehouseFormModal = ({ isOpen, warehouse, onSave, onCancel, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        ...defaultFormValues,
        ...warehouse,
        capacity: warehouse.capacity ?? '',
        address: {
          ...defaultFormValues.address,
          ...(warehouse.address || {}),
        },
        contact: {
          ...defaultFormValues.contact,
          ...(warehouse.contact || {}),
        },
      });
    } else {
      reset(defaultFormValues);
    }
  }, [warehouse, reset]);

  const onSubmit = (values) => {
    const payload = sanitizePayload(values);
    onSave(payload);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
      maxWidth="4xl"
      variant="centered"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="max-h-[70vh] overflow-y-auto px-1 space-y-8 custom-scrollbar">
          {/* General Information */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <span className="w-8 h-px bg-gray-100 mr-3"></span>
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Name *</label>
                <div className="relative">
                  <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('name', { required: 'Warehouse name is required' })}
                    placeholder="Main Warehouse"
                    className="pl-11 py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                {errors.name && <p className="text-[10px] font-bold text-red-500 px-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Code *</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...register('code', {
                      required: 'Warehouse code is required',
                      maxLength: { value: 50, message: 'Maximum 50 characters' },
                    })}
                    className="pl-11 py-6 uppercase bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="MAIN"
                  />
                </div>
                {errors.code && <p className="text-[10px] font-bold text-red-500 px-1">{errors.code.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Description</label>
              <Textarea
                {...register('description', { maxLength: { value: 500, message: 'Max 500 characters' } })}
                rows={2}
                className="bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all resize-none p-4"
                placeholder="Purposes or coverage..."
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <span className="w-8 h-px bg-gray-100 mr-3"></span>
              Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Address Line 1</label>
                <Input
                  {...register('address.line1')}
                  placeholder="Street, number..."
                  className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Address Line 2</label>
                <Input
                  {...register('address.line2')}
                  placeholder="Suite, building..."
                  className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">City</label>
                <Input {...register('address.city')} className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">State</label>
                <Input {...register('address.state')} className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Postal</label>
                <Input {...register('address.postalCode')} className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Country</label>
                <Input {...register('address.country')} className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <span className="w-8 h-px bg-gray-100 mr-3"></span>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Contact Person</label>
                <Input {...register('contact.name')} placeholder="Person name" className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Phone</label>
                <Input {...register('contact.phone')} placeholder="Phone number" className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Email</label>
                <Input {...register('contact.email')} placeholder="Email address" className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <span className="w-8 h-px bg-gray-100 mr-3"></span>
              Configuration & Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Storage Capacity</label>
                <Input type="number" {...register('capacity')} className="py-6 bg-gray-50 border-none rounded-2xl text-sm font-semibold" placeholder="Units..." />
              </div>
              <div className="flex items-center group cursor-pointer">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  register('isPrimary').value ? 'bg-primary-600 border-primary-600' : 'border-gray-200 bg-white group-hover:border-primary-400'
                }`}>
                  <input type="checkbox" {...register('isPrimary')} className="hidden" id="isPrimary" />
                  {register('isPrimary').value && <CheckCircle className="h-4 w-4 text-white" />}
                </div>
                <label htmlFor="isPrimary" className="ml-3 cursor-pointer">
                  <p className="text-sm font-bold text-gray-700">Primary</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Default Source</p>
                </label>
              </div>
              <div className="flex items-center group cursor-pointer">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  register('isActive').value ? 'bg-green-600 border-green-600' : 'border-gray-200 bg-white group-hover:border-green-400'
                }`}>
                  <input type="checkbox" {...register('isActive')} className="hidden" id="isActive" />
                  {register('isActive').value && <CheckCircle className="h-4 w-4 text-white" />}
                </div>
                <label htmlFor="isActive" className="ml-3 cursor-pointer">
                  <p className="text-sm font-bold text-gray-700">Active</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Enable selection</p>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-end space-x-4">
          <Button type="button" variant="ghost" className="px-8 font-bold text-gray-400 hover:text-gray-600" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="default" className="px-10 rounded-2xl font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-all" disabled={isSubmitting}>
            {isSubmitting ? <LoadingButton /> : (warehouse ? 'Update Warehouse' : 'Create Warehouse')}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

const Warehouses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const { confirmDelete, deleteDialog } = useDeleteConfirmation();

  const { data: warehousesResponse, isLoading, error, isFetching, refetch: refetchWarehouses } = useGetWarehousesQuery(
    {
      search: searchTerm || undefined,
      isActive: showActiveOnly ? 'true' : undefined,
      limit: 100,
    }
  );

  // Extract warehouses array from response and normalize snake_case from API (e.g. is_active → isActive)
  const warehouses = React.useMemo(() => {
    let list = [];
    if (!warehousesResponse) return [];
    if (warehousesResponse?.data?.data?.items) list = warehousesResponse.data.data.items;
    else if (warehousesResponse?.data?.items) list = warehousesResponse.data.items;
    else if (warehousesResponse?.data?.warehouses) list = warehousesResponse.data.warehouses;
    else if (warehousesResponse?.warehouses) list = warehousesResponse.warehouses;
    else if (Array.isArray(warehousesResponse)) list = warehousesResponse;
    return list.map((w) => ({
      ...w,
      _id: w._id ?? w.id,
      isActive: w.isActive ?? w.is_active,
      isPrimary: w.isPrimary ?? w.is_primary
    }));
  }, [warehousesResponse]);

  // Mutations
  const [createWarehouse] = useCreateWarehouseMutation();
  const [updateWarehouse] = useUpdateWarehouseMutation();
  const [deleteWarehouse] = useDeleteWarehouseMutation();

  const handleSave = async (formData) => {
    try {
      if (selectedWarehouse) {
        await updateWarehouse({ id: selectedWarehouse._id, ...formData }).unwrap();
        toast.success('Warehouse updated successfully');
      } else {
        await createWarehouse(formData).unwrap();
        toast.success('Warehouse created successfully');
      }
      setIsModalOpen(false);
      setSelectedWarehouse(null);
      refetchWarehouses();
    } catch (mutationError) {
      const message =
        mutationError?.data?.message || mutationError?.message || 'Unable to save warehouse';
      toast.error(message);
    }
  };

  const handleAdd = () => {
    setSelectedWarehouse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleDelete = async (warehouse) => {
    const confirmed = await confirmDelete(
      `Are you sure you want to delete "${warehouse.name}" warehouse? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await deleteWarehouse(warehouse._id).unwrap();
        toast.success('Warehouse deleted successfully');
        refetchWarehouses();
      } catch (mutationError) {
        const message =
          mutationError?.data?.message || mutationError?.message || 'Unable to delete warehouse';
        toast.error(message);
      }
    }
  };

  const isSubmitting = false; // Can track mutation loading states if needed

  if (isLoading) {
    return <LoadingPage message="Loading warehouses..." />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <LoadingCard title="Failed to load warehouses">
          <p className="text-sm text-red-500">
            {error.message || 'Something went wrong while fetching warehouses.'}
          </p>
        </LoadingCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage warehouse locations, contacts, capacity, and availability.
          </p>
        </div>
        <Button onClick={handleAdd} variant="default" size="default" className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>Add Warehouse</span>
        </Button>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or code..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="checkbox"
              />
              <span className="text-sm font-medium text-gray-700">Show active only</span>
            </label>
          </div>
          {isFetching && (
            <div className="flex items-end justify-end text-xs text-gray-500">
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Refreshing...
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {warehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No warehouses found. Click &ldquo;Add Warehouse&rdquo; to create the first one.
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => {
                  const address = warehouse.address || {};
                  const contact = warehouse.contact || {};
                  const locationSummary = [address.city, address.state, address.country]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={warehouse._id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                            <Warehouse className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold text-gray-900">{warehouse.name}</p>
                              {warehouse.isPrimary && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Code: {warehouse.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {locationSummary || address.line1 || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {contact.name ? (
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{contact.name}</p>
                            <p className="text-xs text-gray-500">{contact.phone || 'No phone'}</p>
                            <p className="text-xs text-gray-500">{contact.email || 'No email'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No contact</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            warehouse.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {warehouse.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(warehouse)}
                            className="rounded-md p-2 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(warehouse)}
                            className="rounded-md p-2 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-4 md:hidden">
          {warehouses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No warehouses found. Tap &ldquo;Add Warehouse&rdquo; to create one.
            </div>
          ) : (
            warehouses.map((warehouse) => {
              const address = warehouse.address || {};
              const contact = warehouse.contact || {};
              const locationSummary = [address.city, address.state, address.country]
                .filter(Boolean)
                .join(', ');

              return (
                <div key={warehouse._id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                        {warehouse.isPrimary && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs uppercase text-gray-500">Code: {warehouse.code}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        warehouse.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Location:</span>{' '}
                      {locationSummary || address.line1 || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Contact:</span>{' '}
                      {contact.name || 'Not assigned'}
                    </p>
                    {contact.phone && <p>Phone: {contact.phone}</p>}
                    {contact.email && <p>Email: {contact.email}</p>}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button
                      onClick={() => handleEdit(warehouse)}
                      variant="secondary"
                      size="default"
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(warehouse)}
                      variant="destructive"
                      size="default"
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <WarehouseFormModal
          isOpen={isModalOpen}
          warehouse={selectedWarehouse}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedWarehouse(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {deleteDialog}
    </div>
  );
};

export default Warehouses;

