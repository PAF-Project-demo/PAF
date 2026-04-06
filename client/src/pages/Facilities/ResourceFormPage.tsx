import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { getResource, createResource, updateResource, Resource } from "../../lib/resourceService";

export default function ResourceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Resource>({
    name: "",
    type: "LECTURE_HALL",
    location: "",
    capacity: undefined,
    availabilityWindows: "",
    description: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      getResource(id).then(setFormData).catch(() => alert("Failed to fetch resource"));
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "capacity" ? (value === "" ? undefined : Number(value)) : value
    }));
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
      alert("Failed to save resource. Ensure all required fields are filled.");
    }
  };

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
            <input type="text" name="availabilityWindows" placeholder="e.g. Mon-Fri 08:00-18:00" value={formData.availabilityWindows || ""} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea name="description" value={formData.description || ""} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" rows={4} />
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
