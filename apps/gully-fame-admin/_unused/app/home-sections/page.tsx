'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';
import { Layout, Plus, Save, Trash2, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, Edit2, X, Check } from 'lucide-react';
import { getUserRole } from '@/lib/auth';

interface HomeSection {
  id: string;
  title: string;
  type: 'trending' | 'custom';
  enabled: boolean;
  order: number;
  subtitle?: string;
  description?: string;
}

const defaultSections: HomeSection[] = [
  {
    id: '1',
    title: 'Trending',
    type: 'trending',
    enabled: true,
    order: 1,
    subtitle: 'Trending Reels',
    description: 'Most popular reels right now',
  },
  {
    id: '2',
    title: 'Upcoming',
    type: 'custom',
    enabled: true,
    order: 2,
    subtitle: 'Join now',
    description: 'Competitions starting soon',
  },
];

export default function HomeSectionsPage() {
  const userRole = getUserRole();
  const [sections, setSections] = useState<HomeSection[]>(defaultSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HomeSection>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState<Partial<HomeSection>>({
    title: '',
    type: 'custom',
    enabled: true,
    subtitle: '',
    description: '',
  });

  if (userRole !== 'admin') {
    return <div>Access Denied</div>;
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    newSections[index - 1].order = index;
    newSections[index].order = index + 1;
    setSections(newSections);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    newSections[index].order = index + 1;
    newSections[index + 1].order = index + 2;
    setSections(newSections);
  };

  const handleToggleEnabled = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section.id);
    setEditForm({ ...section });
  };

  const handleSaveEdit = () => {
    if (editingSection && editForm.title) {
      setSections(sections.map(s => 
        s.id === editingSection ? { ...s, ...editForm } : s
      ));
      setEditingSection(null);
      setEditForm({});
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const handleAddSection = () => {
    if (newSection.title) {
      const maxOrder = Math.max(...sections.map(s => s.order), 0);
      setSections([
        ...sections,
        {
          id: Date.now().toString(),
          title: newSection.title!,
          type: newSection.type || 'custom',
          enabled: newSection.enabled ?? true,
          order: maxOrder + 1,
          subtitle: newSection.subtitle,
          description: newSection.description,
        }
      ]);
      setShowAddModal(false);
      setNewSection({ title: '', type: 'custom', enabled: true, subtitle: '', description: '' });
    }
  };

  const handleSaveAll = () => {
    
    alert('Home page sections configuration saved successfully!');
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      trending: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.custom;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
        {}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Home Page Sections</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">Configure section titles, visibility, and order for the home page</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1 sm:space-x-2 rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-1 sm:flex-initial justify-center"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Add Section</span>
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center space-x-1 sm:space-x-2 rounded-lg bg-primary-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm flex-1 sm:flex-initial justify-center"
            >
              <Save className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>

        {}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong> Sections are automatically generated based on user behavior and content. 
            You can customize the titles, enable/disable sections, and reorder them. Content within each section 
            is automatically populated by the app's algorithm.
          </p>
        </div>

        {/* Sections List */}
        <div className="space-y-3">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <div
                key={section.id}
                className={`rounded-xl border-2 transition-all ${
                  section.enabled
                    ? 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Drag Handle */}
                      <div className="flex flex-col items-center justify-center space-y-1 pt-1">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                          <ArrowUp className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === sections.length - 1}
                          className={`p-1 rounded ${index === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        >
                          <ArrowDown className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Section Info */}
                      <div className="flex-1">
                        {editingSection === section.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Section Title *
                              </label>
                              <input
                                type="text"
                                value={editForm.title || ''}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                placeholder="Section title"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Subtitle (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={editForm.subtitle || ''}
                                  onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                  placeholder="Subtitle"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Type
                                </label>
                                <select
                                  value={editForm.type || 'custom'}
                                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                >
                                  <option value="trending">Trending</option>
                                  <option value="custom">Custom</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center space-x-1 rounded-lg bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700 text-sm font-medium"
                              >
                                <Check className="h-4 w-4" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSection(null);
                                  setEditForm({});
                                }}
                                className="flex items-center space-x-1 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                              >
                                <X className="h-4 w-4" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(section.type)}`}>
                                {section.type.replace('-', ' ')}
                              </span>
                              {!section.enabled && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                                  Hidden
                                </span>
                              )}
                            </div>
                            {section.subtitle && (
                              <p className="text-sm text-gray-600 mb-1">{section.subtitle}</p>
                            )}
                            {section.description && (
                              <p className="text-xs text-gray-500">{section.description}</p>
                            )}
                            <div className="mt-2 text-xs text-gray-400">
                              Order: {section.order} • Content: Auto-generated
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {editingSection !== section.id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleEnabled(section.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            section.enabled
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={section.enabled ? 'Hide section' : 'Show section'}
                        >
                          {section.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleEdit(section)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Edit section"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        {section.type === 'custom' && (
                          <button
                            onClick={() => handleDelete(section.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Delete section"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Add Section Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add New Section</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSection({ title: '', type: 'custom', enabled: true, subtitle: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSection.title || ''}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder="e.g., New Releases, Top Picks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newSection.type || 'custom'}
                    onChange={(e) => setNewSection({ ...newSection, type: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="trending">Trending</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSection.subtitle || ''}
                    onChange={(e) => setNewSection({ ...newSection, subtitle: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Optional subtitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={newSection.description || ''}
                    onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                    placeholder="Brief description of this section"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={newSection.enabled ?? true}
                    onChange={(e) => setNewSection({ ...newSection, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Enable this section
                  </label>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewSection({ title: '', type: 'custom', enabled: true, subtitle: '', description: '' });
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSection}
                    className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Section</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

