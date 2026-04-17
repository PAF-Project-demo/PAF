import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import { fetchResources, deleteResource, Resource } from "../../lib/resourceService";
import { getStoredAuthSession, isAdminRole } from "../../lib/auth";
import { TrashBinIcon, PencilIcon, PlusIcon } from "../../icons";

export default function ResourceListPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCapacity, setFilterCapacity] = useState("");

  const authSession = getStoredAuthSession();
  const isAdmin = isAdminRole(authSession?.role);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (filterType) filters.type = filterType;
      if (filterLocation) filters.location = filterLocation;
      if (filterCapacity) filters.capacity = parseInt(filterCapacity, 10);
      
      const data = await fetchResources(filters);
      setResources(data);
    } catch (err) {
      setError("Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [filterType, filterLocation, filterCapacity]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      try {
        await deleteResource(id);
        setResources((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        alert("Failed to delete resource");
      }
    }
  };

  const getStatusColor = (status?: string) => {
    return status === "ACTIVE" ? "success" : "error";
  };

  return (
    <>
      <PageMeta title="EduNexus" description="EduNexus - Student Management System" />
      <PageBreadcrumb pageTitle="Facilities & Assets" />
      
      <div className="space-y-6">
        <ComponentCard title="Resource Catalogue" desc="Browse and filter all available facilities and equipment.">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <select 
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
              <input 
                type="text" 
                placeholder="Location" 
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Min Capacity" 
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={filterCapacity}
                onChange={(e) => setFilterCapacity(e.target.value)}
              />
            </div>
            {isAdmin && (
              <Link to="/resources/new">
                <Button size="sm" startIcon={<PlusIcon className="h-4 w-4" />}>
                  Add Resource
                </Button>
              </Link>
            )}
          </div>

          {isAdmin ? (
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[760px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 text-start">Name</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-start">Type</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-start">Location</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-start">Capacity</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-start">Status</TableCell>
                      <TableCell isHeader className="px-5 py-3 text-start">Action</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="px-5 py-10"><LoadingIndicator className="mx-auto" /></TableCell></TableRow>
                    ) : error ? (
                      <TableRow><TableCell colSpan={6} className="px-5 py-10 text-center text-red-500">{error}</TableCell></TableRow>
                    ) : resources.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="px-5 py-10 text-center">No resources found.</TableCell></TableRow>
                    ) : (
                      resources.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="px-5 py-4"><span className="font-semibold text-gray-800 dark:text-white">{resource.name}</span></TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{resource.type}</TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{resource.location}</TableCell>
                          <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{resource.capacity || 'N/A'}</TableCell>
                          <TableCell className="px-5 py-4">
                            <Badge size="sm" variant="light" color={getStatusColor(resource.status)}>
                              {resource.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="flex gap-2">
                              <Link to={`/resources/${resource.id}`}>
                                <Button size="sm" variant="outline">View</Button>
                              </Link>
                              <>
                                <Link to={`/resources/${resource.id}/edit`}>
                                  <Button size="sm" variant="outline" startIcon={<PencilIcon className="h-4 w-4" />}>Edit</Button>
                                </Link>
                                <Button size="sm" variant="danger" startIcon={<TrashBinIcon className="h-4 w-4" />} onClick={() => handleDelete(resource.id!)}>Delete</Button>
                              </>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full py-10"><LoadingIndicator className="mx-auto" /></div>
              ) : error ? (
                <div className="col-span-full py-10 text-center text-red-500">{error}</div>
              ) : resources.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-500">No resources found matching your search.</div>
              ) : (
                resources.map((resource) => (
                  <div key={resource.id} className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="h-48 w-full bg-gray-100 dark:bg-gray-900 relative">
                      {resource.imageUrl ? (
                        <img src={resource.imageUrl} alt={resource.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 text-brand-500 font-medium">
                          {resource.type}
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge size="sm" variant="solid" color={getStatusColor(resource.status)}>
                          {resource.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white truncate mb-1" title={resource.name}>{resource.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{resource.location}</p>
                      
                      <div className="space-y-2 mt-auto mb-5 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Capacity:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{resource.capacity || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Availability:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate ml-2" title={resource.availabilityWindows || "N/A"}>{resource.availabilityWindows || "N/A"}</span>
                        </div>
                      </div>
                      
                      <Link to={`/resources/${resource.id}`} className="mt-auto block">
                        <Button className="w-full" variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
