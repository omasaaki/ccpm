import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Tree,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { organizationService } from '../../services/organizationService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { NotificationSnackbar } from '../../components/ui/NotificationSnackbar';

interface Organization {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    departments: number;
    users: number;
  };
}

interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  organizationId: string;
  parentId?: string;
  parent?: Department;
  children: Department[];
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    users: number;
  };
}

const Organizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<{ [orgId: string]: Department[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Pagination for organizations
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialogs
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Forms
  const [orgForm, setOrgForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    organizationId: '',
    parentId: '',
    managerId: '',
    isActive: true,
  });

  // Expanded organizations for department view
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrganizations();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationService.listOrganizations({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      });

      setOrganizations(response.data.organizations);
      setTotal(response.data.pagination.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async (organizationId: string) => {
    try {
      const response = await organizationService.getDepartmentHierarchy(organizationId);
      setDepartments(prev => ({ ...prev, [organizationId]: response.data }));
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleCreateOrganization = () => {
    setEditingOrg(null);
    setOrgForm({ name: '', description: '', isActive: true });
    setOrgDialogOpen(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      description: org.description || '',
      isActive: org.isActive,
    });
    setOrgDialogOpen(true);
  };

  const handleSaveOrganization = async () => {
    try {
      if (editingOrg) {
        await organizationService.updateOrganization(editingOrg.id, orgForm);
        setNotification({ message: 'Organization updated successfully', severity: 'success' });
      } else {
        await organizationService.createOrganization(orgForm);
        setNotification({ message: 'Organization created successfully', severity: 'success' });
      }
      setOrgDialogOpen(false);
      loadOrganizations();
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to save organization', severity: 'error' });
    }
  };

  const handleDeleteOrganization = async (org: Organization) => {
    if (!window.confirm(`Are you sure you want to delete organization ${org.name}?`)) {
      return;
    }

    try {
      await organizationService.deleteOrganization(org.id);
      setNotification({ message: 'Organization deleted successfully', severity: 'success' });
      loadOrganizations();
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to delete organization', severity: 'error' });
    }
  };

  const handleCreateDepartment = (organizationId: string, parentId?: string) => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      description: '',
      organizationId,
      parentId: parentId || '',
      managerId: '',
      isActive: true,
    });
    setDeptDialogOpen(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || '',
      organizationId: dept.organizationId,
      parentId: dept.parentId || '',
      managerId: dept.manager?.id || '',
      isActive: dept.isActive,
    });
    setDeptDialogOpen(true);
  };

  const handleSaveDepartment = async () => {
    try {
      if (editingDept) {
        await organizationService.updateDepartment(editingDept.id, {
          name: deptForm.name,
          description: deptForm.description,
          parentId: deptForm.parentId || undefined,
          managerId: deptForm.managerId || undefined,
          isActive: deptForm.isActive,
        });
        setNotification({ message: 'Department updated successfully', severity: 'success' });
      } else {
        await organizationService.createDepartment({
          name: deptForm.name,
          description: deptForm.description,
          organizationId: deptForm.organizationId,
          parentId: deptForm.parentId || undefined,
          managerId: deptForm.managerId || undefined,
        });
        setNotification({ message: 'Department created successfully', severity: 'success' });
      }
      setDeptDialogOpen(false);
      loadDepartments(deptForm.organizationId);
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to save department', severity: 'error' });
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (!window.confirm(`Are you sure you want to delete department ${dept.name}?`)) {
      return;
    }

    try {
      await organizationService.deleteDepartment(dept.id);
      setNotification({ message: 'Department deleted successfully', severity: 'success' });
      loadDepartments(dept.organizationId);
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to delete department', severity: 'error' });
    }
  };

  const handleToggleOrgExpansion = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
      if (!departments[orgId]) {
        loadDepartments(orgId);
      }
    }
    setExpandedOrgs(newExpanded);
  };

  const renderDepartmentTree = (departments: Department[], organizationId: string, level = 0) => {
    return departments.map((dept) => (
      <Box key={dept.id} sx={{ ml: level * 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 1,
            px: 2,
            borderRadius: 1,
            backgroundColor: level % 2 === 0 ? 'background.paper' : 'grey.50',
          }}
        >
          <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              {dept.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dept.manager ? `Manager: ${dept.manager.name}` : 'No manager'} • {dept._count.users} users
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => handleCreateDepartment(organizationId, dept.id)}>
              <AddIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleEditDepartment(dept)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleDeleteDepartment(dept)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        {dept.children.length > 0 && renderDepartmentTree(dept.children, organizationId, level + 1)}
      </Box>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && organizations.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Organization Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadOrganizations}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateOrganization}
            >
              Add Organization
            </Button>
          </Box>
        </Box>

        {error && <ErrorMessage message={error} sx={{ mb: 2 }} />}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search organizations"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
        </Box>

        {/* Organizations List with Departments */}
        {organizations.map((org) => (
          <Accordion
            key={org.id}
            expanded={expandedOrgs.has(org.id)}
            onChange={() => handleToggleOrgExpansion(org.id)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{org.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {org.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Chip
                      label={org.isActive ? 'Active' : 'Inactive'}
                      color={org.isActive ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip label={`${org._count.departments} departments`} size="small" />
                    <Chip label={`${org._count.users} users`} size="small" />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => handleEditOrganization(org)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteOrganization(org)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Departments</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleCreateDepartment(org.id)}
                >
                  Add Department
                </Button>
              </Box>
              {departments[org.id] ? (
                departments[org.id].length > 0 ? (
                  renderDepartmentTree(departments[org.id], org.id)
                ) : (
                  <Typography color="text.secondary">No departments found</Typography>
                )
              ) : (
                <LoadingSpinner size="small" />
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Organization Dialog */}
      <Dialog open={orgDialogOpen} onClose={() => setOrgDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={orgForm.isActive}
                  onChange={(e) => setOrgForm({ ...orgForm, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrgDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveOrganization} variant="contained">
            {editingOrg ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={deptForm.isActive}
                  onChange={(e) => setDeptForm({ ...deptForm, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeptDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDepartment} variant="contained">
            {editingDept ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      {notification && (
        <NotificationSnackbar
          message={notification.message}
          severity={notification.severity}
          onClose={() => setNotification(null)}
        />
      )}
    </Box>
  );
};

export default Organizations;