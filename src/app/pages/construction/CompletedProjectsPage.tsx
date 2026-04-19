import { useNavigate } from "react-router";
import { Search, Calendar, MapPin, CheckCircle2 } from "lucide-react";

export function CompletedProjectsPage() {
  const navigate = useNavigate();
  const completedProjects = [
    {
      id: "P001",
      name: "Harbor View Residential Complex",
      location: "Downtown District",
      completionDate: "2026-02-15",
      budget: 12500000,
      duration: "18 months",
      contractor: "Premier Construction Co.",
      projectManager: "John Smith",
    },
    {
      id: "P003",
      name: "City Center Mall Renovation",
      location: "Central Business District",
      completionDate: "2026-01-28",
      budget: 8750000,
      duration: "12 months",
      contractor: "Urban Builders Inc.",
      projectManager: "Sarah Johnson",
    },
    {
      id: "P007",
      name: "Green Park Office Tower",
      location: "Tech Park Area",
      completionDate: "2025-12-10",
      budget: 15200000,
      duration: "24 months",
      contractor: "Skyline Constructions",
      projectManager: "Michael Chen",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Completed Projects</h1>
        <p className="text-sm text-gray-600 mt-1">
          Successfully completed construction projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Completed</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">24</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">$285M</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600">This Year</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">5</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600">Avg. Duration</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">15.8 mo</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search completed projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>All Years</option>
            <option>2026</option>
            <option>2025</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {completedProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => navigate(`/apps/construction/projects/${project.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {project.id}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Completed: {project.completionDate}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                  <div>Budget: ${(project.budget / 1000000).toFixed(1)}M • Duration: {project.duration}</div>
                  <div className="mt-1">PM: {project.projectManager} • Contractor: {project.contractor}</div>
                </div>
              </div>

              <button
                onClick={e => { e.stopPropagation(); navigate(`/apps/construction/projects/${project.id}`); }}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
