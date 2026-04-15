import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { getResource, createResource, updateResource, Resource } from "../../lib/resourceService";
import { getStoredAuthSession, isAdminRole } from "../../lib/auth";
import React from 'react';

export default function ResourceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const authSession = getStoredAuthSession();
  const isAdmin = isAdminRole(authSession?.role);

  const [formData, setFormData] = useState<Resource>({
    name: "",
    type: "LECTURE_HALL",
    location: "",
    capacity: undefined,
    availabilityWindows: "Weekday 08:00",
    imageUrl: "",
  });

  const [weekdayFrom, setWeekdayFrom] = useState("08:00");
  const [weekdayTo, setWeekdayTo] = useState("18:00");
  const [weekendFrom, setWeekendFrom] = useState("");
  const [weekendTo, setWeekendTo] = useState("");

  useEffect(() => {
    let windows = [];
    if (weekdayFrom && weekdayTo) windows.push(`Weekday ${weekdayFrom}-${weekdayTo}`);
    if (weekendFrom && weekendTo) windows.push(`Weekend ${weekendFrom}-${weekendTo}`);
    setFormData(prev => ({ ...prev, availabilityWindows: windows.length > 0 ? windows.join(", ") : "None" }));
  }, [weekdayFrom, weekdayTo, weekendFrom, weekendTo]);

  useEffect(() => {
    if (isEditing && id) {
      getResource(id).then((data) => {
        setFormData(data);
        if (data.availabilityWindows) {
          const wdMatch = data.availabilityWindows.match(/Weekday (\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (wdMatch) {
            setWeekdayFrom(wdMatch[1]);
            setWeekdayTo(wdMatch[2]);
          } else {
            setWeekdayFrom(""); setWeekdayTo("");
          }
          const weMatch = data.availabilityWindows.match(/Weekend (\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (weMatch) {
            setWeekendFrom(weMatch[1]);
            setWeekendTo(weMatch[2]);
          } else {
            setWeekendFrom(""); setWeekendTo("");
          }
        }
      }).catch(() => alert("Failed to fetch resource"));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "capacity" ? (value === "" ? undefined : Number(value)) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setFormData(prev => ({ ...prev, imageUrl: compressedBase64 }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && id) {
        await updateResource(id, formData);
      } else {
        await createResource(formData);
      }
      navigate("/resources");
    } catch (err: any) {
      alert(err.message || "Failed to save resource. Ensure all required fields are filled.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-500 font-bold text-lg">
        Access Denied: Only administrators can add or edit resources.
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle={isEditing ? "Edit Resource" : "Add Resource"} />
      <ComponentCard title={isEditing ? "Edit Facilities & Assets" : "Add New Resource"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Type *</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
              <option value="LECTURE_HALL">Lecture Hall</option>
              <option value="LAB">Lab</option>
              <option value="MEETING_ROOM">Meeting Room</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Location *</label>
            <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
            <input type="number" name="capacity" value={formData.capacity || ""} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Availability Windows</label>
            <div className="space-y-3">
              <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg p-3 flex-col sm:flex-row gap-3">
                <div className="flex-1 font-medium self-center text-sm">Weekday:</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">From</span>
                  <input type="time" value={weekdayFrom} onChange={(e) => setWeekdayFrom(e.target.value)} className="rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  <span className="text-sm">To</span>
                  <input type="time" value={weekdayTo} onChange={(e) => setWeekdayTo(e.target.value)} className="rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg p-3 flex-col sm:flex-row gap-3">
                <div className="flex-1 font-medium self-center text-sm">Weekend:</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">From</span>
                  <input type="time" value={weekendFrom} onChange={(e) => setWeekendFrom(e.target.value)} className="rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                  <span className="text-sm">To</span>
                  <input type="time" value={weekendTo} onChange={(e) => setWeekendTo(e.target.value)} className="rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Picture Upload</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white mb-2" />
            {formData.imageUrl && (
              <div className="relative inline-block mt-2">
                <img src={formData.imageUrl} alt="Resource Preview" className="h-32 w-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                  title="Remove Picture"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button size="sm" variant="outline" onClick={() => navigate("/resources")} type="button">Cancel</Button>
            <Button size="sm" type="submit">Save</Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
