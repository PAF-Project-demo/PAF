import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import LoadingIndicator from "../../components/common/LoadingIndicator";
import Badge from "../../components/ui/badge/Badge";
import { getResource, updateResourceStatus, Resource } from "../../lib/resourceService";
import { getStoredAuthSession, isAdminRole } from "../../lib/auth";

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authSession = getStoredAuthSession();
  const isAdmin = isAdminRole(authSession?.role);

  useEffect(() => {
    const fetchRes = async () => {
      try {
        if (id) {
          const data = await getResource(id);
          setResource(data);
        }
      } catch (err) {
        alert("Failed to access resource.");
        navigate("/resources");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRes();
  }, [id, navigate]);

  const handleToggleStatus = async () => {
    if (!resource || !id) return;
    const newStatus = resource.status === "ACTIVE" ? "OUT_OF_SERVICE" : "ACTIVE";
    try {
      const updated = await updateResourceStatus(id, newStatus);
      setResource(updated);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (isLoading) return <div className="p-8"><LoadingIndicator className="mx-auto" /></div>;
  if (!resource) return <div>Resource not found</div>;

  return (
    <>
      <PageBreadcrumb pageTitle="Resource Detail" />
      <ComponentCard title={resource.name} desc={`Details about ${resource.name}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-800 dark:text-white">Status:</span>
            <Badge size="sm" variant="solid" color={resource.status === "ACTIVE" ? "success" : "error"}>{resource.status}</Badge>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={handleToggleStatus}>
                Toggle Status
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p><span className="font-semibold dark:text-gray-300">Type:</span> <span className="text-gray-600 dark:text-gray-400">{resource.type}</span></p>
              <p><span className="font-semibold dark:text-gray-300">Location:</span> <span className="text-gray-600 dark:text-gray-400">{resource.location}</span></p>
              <p><span className="font-semibold dark:text-gray-300">Capacity:</span> <span className="text-gray-600 dark:text-gray-400">{resource.capacity || "N/A"}</span></p>
              <p><span className="font-semibold dark:text-gray-300">Availability:</span> <span className="text-gray-600 dark:text-gray-400">{resource.availabilityWindows || "N/A"}</span></p>
            </div>
            
            {resource.imageUrl && (
              <div className="flex justify-start md:justify-end">
                <img 
                  src={resource.imageUrl} 
                  alt={resource.name} 
                  className="max-h-56 max-w-full rounded-xl object-cover shadow-sm border border-gray-200 dark:border-gray-700" 
                />
              </div>
            )}
          </div>
          {/* <p><span className="font-semibold dark:text-gray-300">Description:</span> {resource.description || "N/A"}</p> */}

          <div className="mt-6 flex gap-4">
            <Link to="/resources">
              <Button variant="outline">Back to List</Button>
            </Link>
            {isAdmin && (
              <Link to={`/resources/${resource.id}/edit`}>
                <Button>Edit Resource</Button>
              </Link>
            )}
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
