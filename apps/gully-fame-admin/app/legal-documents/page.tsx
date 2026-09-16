'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useUserRole } from '@/contexts/UserRoleContext';

interface LegalDocument {
  id: string;
  type: 'terms_of_service' | 'privacy_policy' | 'faqs';
  title: string;
  content: string;
  version: number;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  createdBy: string;
  changes?: string;
}

interface DocumentVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
}

export default function LegalDocumentsPage() {
  const { role } = useUserRole();
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [message, setMessage] = useState('');

  const documentTypes = [
    { value: 'terms_of_service', label: 'Terms of Service' },
    { value: 'privacy_policy', label: 'Privacy Policy' },
    { value: 'faqs', label: 'FAQs' },
  ];

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/legal-documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setMessage('Error loading documents');
    }
    setLoading(false);
  };

  const fetchVersions = async (docId: string) => {
    try {
      const response = await fetch(`/api/admin/legal-documents/${docId}/versions`);
      const data = await response.json();
      if (data.success) {
        setVersions(data.data);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleEditDocument = (doc: LegalDocument) => {
    setEditingDoc({ ...doc });
    setDialogOpen(true);
  };

  const handleCreateDocument = (type: string) => {
    setEditingDoc({
      id: '',
      type: type as LegalDocument['type'],
      title: '',
      content: '',
      version: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
    });
    setDialogOpen(true);
  };

  const handleSaveDocument = async (publish = false) => {
    if (!editingDoc || !editingDoc.title || !editingDoc.content) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const endpoint = editingDoc.id
        ? `/api/admin/legal-documents/${editingDoc.id}`
        : '/api/admin/legal-documents';

      const method = editingDoc.id ? 'PUT' : 'POST';

      const payload = {
        ...editingDoc,
        status: publish ? 'published' : 'draft',
        publishedAt: publish ? new Date().toISOString() : undefined,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Document ${publish ? 'published' : 'saved'} successfully`);
        setDialogOpen(false);
        setEditingDoc(null);
        fetchDocuments();
      } else {
        setMessage(data.error || 'Error saving document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setMessage('Error saving document');
    }
    setLoading(false);
  };

  const handlePublishDocument = async (docId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/legal-documents/${docId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Document published successfully');
        fetchDocuments();
      } else {
        setMessage(data.error || 'Error publishing document');
      }
    } catch (error) {
      console.error('Error publishing document:', error);
      setMessage('Error publishing document');
    }
    setLoading(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/legal-documents/${docId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Document deleted successfully');
        fetchDocuments();
      } else {
        setMessage(data.error || 'Error deleting document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage('Error deleting document');
    }
    setLoading(false);
  };

  const handlePreviewDocument = (doc: LegalDocument) => {
    setSelectedDoc(doc);
    fetchVersions(doc.id);
    setPreviewOpen(true);
  };

  const currentDocs = documents.filter(doc => doc.type === documentTypes[activeTab].value);

  // Check admin authorization
  if (role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Legal Documents Management
      </Typography>

      {message && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue as 0 | 1 | 2)}
        sx={{ mb: 3 }}
      >
        <Tab label="Terms of Service" />
        <Tab label="Privacy Policy" />
        <Tab label="FAQs" />
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleCreateDocument(documentTypes[activeTab].value)}
        >
          Create New Version
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Published Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                currentDocs.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>v{doc.version}</TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        color={doc.status === 'published' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{doc.createdBy}</TableCell>
                    <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {doc.publishedAt
                        ? new Date(doc.publishedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleEditDocument(doc)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handlePreviewDocument(doc)}
                        sx={{ mr: 1 }}
                      >
                        Preview
                      </Button>
                      {doc.status === 'draft' && (
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handlePublishDocument(doc.id)}
                          sx={{ mr: 1 }}
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingDoc?.id ? `Edit Version ${editingDoc.version}` : 'Create New Document'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={editingDoc?.title || ''}
            onChange={e =>
              setEditingDoc(prev => prev ? { ...prev, title: e.target.value } : null)
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Changes / Description"
            multiline
            rows={2}
            value={editingDoc?.changes || ''}
            onChange={e =>
              setEditingDoc(prev => prev ? { ...prev, changes: e.target.value } : null)
            }
            placeholder="Describe what changed in this version"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Document Content"
            multiline
            rows={15}
            value={editingDoc?.content || ''}
            onChange={e =>
              setEditingDoc(prev => prev ? { ...prev, content: e.target.value } : null)
            }
            placeholder="Enter the full document text"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleSaveDocument(false)} color="info">
            Save as Draft
          </Button>
          <Button onClick={() => handleSaveDocument(true)} color="success" variant="contained">
            Save & Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDoc?.title} - Version {selectedDoc?.version}
          <Typography variant="caption" sx={{ display: 'block', color: 'gray', mt: 1 }}>
            Published: {selectedDoc?.publishedAt
              ? new Date(selectedDoc.publishedAt).toLocaleString()
              : 'Not published'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ mt: 2, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {selectedDoc?.content}
          </Box>

          {versions.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Version History</Typography>
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>By</TableCell>
                      <TableCell>Changes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {versions.map(v => (
                      <TableRow key={v.version}>
                        <TableCell>v{v.version}</TableCell>
                        <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{v.createdBy}</TableCell>
                        <TableCell>{v.changes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
