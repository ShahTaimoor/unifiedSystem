import React, { useState, useEffect, useRef } from 'react';
import { Building, Phone, MapPin, Mail, FileText, Image, Save, Share2, Map, Globe, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFetchCompanyQuery,
  useUpdateCompanyMutation,
  useUploadCompanyLogoMutation,
} from '../store/services/companyApi';
import {
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} from '../store/services/settingsApi';
import { LoadingSpinner, LoadingButton } from './LoadingSpinner';
import { handleApiError } from '../utils/errorHandler';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function CompanySettingsForm() {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    companyName: '',
    phone: '',
    address: '',
    email: '',
    taxRegistrationNumber: '',
    taxEnabled: false,
    defaultTaxRate: 0,
    whatsappNumber: '',
    facebookLink: '',
    instagramLink: '',
    tiktokLink: '',
    mapLocation: '',
    showWhatsapp: true,
    showFacebook: true,
    showInstagram: true,
    showTiktok: true,
    showMapLocation: true,
    showContactInfo: true,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dashboardLogoSize, setDashboardLogoSize] = useState(500);

  const { data: companyResponse, isLoading: loadingCompany } = useFetchCompanyQuery();
  const { data: settingsResponse } = useGetCompanySettingsQuery();
  const [updateCompany, { isLoading: updatingCompany }] = useUpdateCompanyMutation();
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadCompanyLogoMutation();
  const [updateSettings, { isLoading: updatingSettings }] = useUpdateCompanySettingsMutation();

  const company = companyResponse?.data || {};
  const settings = settingsResponse?.data?.data ?? settingsResponse?.data ?? {};
  const orderSettings = settings.orderSettings || {};
  const savedLogo = company.logo || '';

  useEffect(() => {
    setForm((f) => ({
      ...f,
      companyName: company.companyName ?? settings.companyName ?? '',
      phone: company.phone ?? settings.contactNumber ?? '',
      address: company.address ?? settings.address ?? '',
      email: settings.email ?? '',
      taxRegistrationNumber: settings.taxId ?? '',
      taxEnabled: settings.taxEnabled === true,
      defaultTaxRate:
        settings.defaultTaxRate != null && settings.defaultTaxRate !== ''
          ? Number(settings.defaultTaxRate)
          : 0,
      whatsappNumber: settings.whatsappNumber ?? '',
      facebookLink: settings.facebookLink ?? '',
      instagramLink: settings.instagramLink ?? '',
      tiktokLink: settings.tiktokLink ?? '',
      mapLocation: settings.mapLocation ?? '',
      showWhatsapp: settings.showWhatsapp !== false,
      showFacebook: settings.showFacebook !== false,
      showInstagram: settings.showInstagram !== false,
      showTiktok: settings.showTiktok !== false,
      showMapLocation: settings.showMapLocation !== false,
      showContactInfo: settings.showContactInfo !== false,
    }));
  }, [
    company.companyName,
    company.phone,
    company.address,
    settings.companyName,
    settings.contactNumber,
    settings.address,
    settings.email,
    settings.taxId,
    settings.taxEnabled,
    settings.defaultTaxRate,
    settings.whatsappNumber,
    settings.facebookLink,
    settings.instagramLink,
    settings.tiktokLink,
    settings.mapLocation,
    settings.showWhatsapp,
    settings.showFacebook,
    settings.showInstagram,
    settings.showTiktok,
    settings.showMapLocation,
    settings.showContactInfo,
  ]);

  useEffect(() => {
    const size = Number(orderSettings.dashboardLogoSize);
    if (Number.isFinite(size) && size >= 120 && size <= 900) {
      setDashboardLogoSize(Math.round(size));
    } else {
      setDashboardLogoSize(500);
    }
  }, [orderSettings.dashboardLogoSize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setLogoPreview(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, GIF, WebP).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be under 5MB.');
      return;
    }
    setSelectedFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      await updateCompany({
        companyName: form.companyName,
        phone: form.phone,
        address: form.address,
      }).unwrap();
      await updateSettings({
        companyName: form.companyName,
        contactNumber: form.phone,
        address: form.address,
        email: form.email,
        taxId: form.taxRegistrationNumber,
        taxEnabled: !!form.taxEnabled,
        defaultTaxRate: Math.min(100, Math.max(0, Number(form.defaultTaxRate) || 0)),
        whatsappNumber: form.whatsappNumber,
        facebookLink: form.facebookLink,
        instagramLink: form.instagramLink,
        tiktokLink: form.tiktokLink,
        mapLocation: form.mapLocation,
        showWhatsapp: !!form.showWhatsapp,
        showFacebook: !!form.showFacebook,
        showInstagram: !!form.showInstagram,
        showTiktok: !!form.showTiktok,
        showMapLocation: !!form.showMapLocation,
        showContactInfo: !!form.showContactInfo,
        orderSettings: {
          ...orderSettings,
          dashboardLogoSize: dashboardLogoSize,
        },
      }).unwrap();
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        await uploadLogo(formData).unwrap();
        setSelectedFile(null);
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      toast.success('Company information saved.');
    } catch (err) {
      handleApiError(err, 'Failed to save company information');
    }
  };

  // Alias for backwards compatibility (e.g. HMR / stale references)
  const handleSaveProfile = handleSaveAll;

  const handleUploadLogo = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image first.');
      return;
    }
    const formData = new FormData();
    formData.append('logo', selectedFile);
    try {
      const res = await uploadLogo(formData).unwrap();
      if (res?.success) {
        toast.success('Logo uploaded.');
        setSelectedFile(null);
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      handleApiError(err, 'Failed to upload logo');
    }
  };

  const displayPreview = logoPreview || savedLogo;
  const isSaving = updatingCompany || updatingSettings || uploadingLogo;

  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Company name</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Tax registration number</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="taxRegistrationNumber"
              value={form.taxRegistrationNumber}
              onChange={handleChange}
              placeholder="Enter tax registration number"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">GST / global sales tax</h3>
          <p className="text-xs text-gray-600 mt-1">
            When enabled, this rate applies to sales invoices, sales orders, and purchases. When disabled, tax is not calculated or shown.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="taxEnabled"
            checked={!!form.taxEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, taxEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-800">Enable tax (GST/VAT)</span>
        </label>
        {form.taxEnabled && (
          <div className="space-y-2 max-w-xs">
            <label className="block text-xs font-medium text-gray-700">Tax percentage (%)</label>
            <input
              type="number"
              name="defaultTaxRate"
              min="0"
              max="100"
              step="0.01"
              value={form.defaultTaxRate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={3}
            placeholder="Enter address"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Online Presence & Location Settings Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Online Presence & Location Settings</h3>
          <p className="text-xs text-gray-500 mt-1">
            Configure links to your social media channels, contact visibility, and Google Maps embed location.
          </p>
        </div>

        {/* Visibility Toggles Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50 p-4 rounded-lg border border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              name="showContactInfo"
              checked={!!form.showContactInfo}
              onChange={(e) => setForm((prev) => ({ ...prev, showContactInfo: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show General Contact Info</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              name="showWhatsapp"
              checked={!!form.showWhatsapp}
              onChange={(e) => setForm((prev) => ({ ...prev, showWhatsapp: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show WhatsApp Link</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              name="showFacebook"
              checked={!!form.showFacebook}
              onChange={(e) => setForm((prev) => ({ ...prev, showFacebook: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Facebook Link</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              name="showInstagram"
              checked={!!form.showInstagram}
              onChange={(e) => setForm((prev) => ({ ...prev, showInstagram: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Instagram Link</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              name="showTiktok"
              checked={!!form.showTiktok}
              onChange={(e) => setForm((prev) => ({ ...prev, showTiktok: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show TikTok Link</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              name="showMapLocation"
              checked={!!form.showMapLocation}
              onChange={(e) => setForm((prev) => ({ ...prev, showMapLocation: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Map Location</span>
          </label>
        </div>

        {/* Input Fields */}
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {/* WhatsApp Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">WhatsApp number</label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="whatsappNumber"
                value={form.whatsappNumber}
                onChange={handleChange}
                placeholder="e.g. +92 311 4000096"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Facebook Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Facebook link</label>
            <div className="relative">
              <Share2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                name="facebookLink"
                value={form.facebookLink}
                onChange={handleChange}
                placeholder="https://facebook.com/yourpage"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Instagram Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Instagram link</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                name="instagramLink"
                value={form.instagramLink}
                onChange={handleChange}
                placeholder="https://instagram.com/yourprofile"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* TikTok Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">TikTok link</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                name="tiktokLink"
                value={form.tiktokLink}
                onChange={handleChange}
                placeholder="https://tiktok.com/@yourprofile"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Map Embed URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Map location / embed link</label>
            <span className="text-xs text-gray-500">Provide the iframe src value from Google Maps</span>
          </div>
          <div className="relative">
            <Map className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              name="mapLocation"
              value={form.mapLocation}
              onChange={handleChange}
              rows={3}
              placeholder="https://www.google.com/maps/embed?pb=..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {form.mapLocation && form.showMapLocation && (
            <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden h-40">
              <iframe
                src={form.mapLocation}
                title="Location Map Preview"
                className="w-full h-full border-none"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Company logo</label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-shrink-0">
            {displayPreview ? (
              <div className="h-28 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                <img
                  src={displayPreview}
                  alt="Company logo preview"
                  crossOrigin="anonymous"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                <Image className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleLogoSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500">JPEG, PNG, GIF or WebP. Max 5MB.</p>
            {selectedFile && (
              <p className="text-xs text-gray-600">
                New logo will be saved when you click &quot;Save company information&quot; below.
              </p>
            )}
          </div>
        </div>
        {savedLogo && !selectedFile && (
          <p className="text-xs text-gray-500">Logo shown above is the saved logo. Choose a new file to replace it.</p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="block text-sm font-medium text-gray-700">
          Dashboard logo size
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="120"
            max="900"
            step="10"
            value={dashboardLogoSize}
            onChange={(e) => setDashboardLogoSize(parseInt(e.target.value, 10) || 500)}
            className="w-full"
          />
          <input
            type="number"
            min="120"
            max="900"
            step="10"
            value={dashboardLogoSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isFinite(v)) return;
              setDashboardLogoSize(Math.min(900, Math.max(120, v)));
            }}
            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
          />
          <span className="text-xs text-gray-500">px</span>
        </div>
        <p className="text-xs text-gray-500">
          Controls the large logo size shown when dashboard data is hidden.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <LoadingButton
          type="button"
          onClick={handleSaveAll}
          loading={isSaving}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save company information
        </LoadingButton>
      </div>
    </form>
  );
}
