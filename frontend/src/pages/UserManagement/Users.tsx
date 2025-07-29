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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
  Checkbox,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  PersonAddDisabled as PersonAddDisabledIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { useApp } from '../../store/AppContext';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
}

const Users: React.FC = () => {
  const { showNotification } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState<{ open: boolean; action: string; }>({ open: false, action: '' });
  const [bulkActionForm, setBulkActionForm] = useState<{ role?: User['role']; organizationId?: string; departmentId?: string; }>({});

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    role: '' as User['role'],
    organizationId: '',
    departmentId: '',
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
    loadOrganizations();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.listUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      });

      setUsers(response.data.users);
      setTotal(response.data.pagination.total);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await organizationService.listOrganizations();
      setOrganizations(response.data.organizations);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  const loadDepartments = async (organizationId: string) => {
    if (!organizationId) {
      setDepartments([]);
      return;
    }

    try {
      const response = await organizationService.listDepartments({ organizationId });
      setDepartments(response.data.departments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event: any) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      username: user.username,
      email: user.email,
      role: user.role,
      organizationId: user.organization?.id || '',
      departmentId: user.department?.id || '',
      isActive: user.isActive,
    });

    if (user.organization?.id) {
      loadDepartments(user.organization.id);
    }

    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await userService.updateUser(editingUser.id, {
        name: editForm.name,
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
      });

      // Update organization/department assignment if changed
      if (editForm.organizationId !== (editingUser.organization?.id || '')) {
        await organizationService.assignUserToOrganization({
          userId: editingUser.id,
          organizationId: editForm.organizationId,
          departmentId: editForm.departmentId || undefined,
        });
      }

      showNotification('User updated successfully', 'success');
      setEditDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user', 'error');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.isActive) {
        await userService.deactivateUser(user.id);
        showNotification('User deactivated successfully', 'success');
      } else {
        await userService.activateUser(user.id);
        showNotification('User activated successfully', 'success');
      }
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      showNotification('User deleted successfully', 'success');
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete user', 'error');
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'MANAGER': return 'warning';
      case 'USER': return 'primary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Bulk selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = new Set(users.map(user => user.id));
      setSelectedUsers(newSelected);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const isUserSelected = (userId: string) => selectedUsers.has(userId);
  const isAllSelected = users.length > 0 && selectedUsers.size === users.length;
  const isIndeterminate = selectedUsers.size > 0 && selectedUsers.size < users.length;

  // Bulk action handlers
  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const handleBulkAction = (action: string) => {
    handleBulkMenuClose();
    if (action === 'role' || action === 'organization') {
      setBulkActionDialog({ open: true, action });
      setBulkActionForm({});
      if (action === 'organization') {
        loadOrganizations();
      }
    } else {
      executeBulkAction(action);
    }
  };

  const executeBulkAction = async (action: string, params?: any) => {
    try {
      const selectedUserIds = Array.from(selectedUsers);
      let result: { successCount: number; failureCount: number } | null = null;

      switch (action) {
        case 'activate':
          const activateResult = await userService.bulkActivate(selectedUserIds);
          result = activateResult.data;
          break;
        case 'deactivate':
          const deactivateResult = await userService.bulkDeactivate(selectedUserIds);
          result = deactivateResult.data;
          break;
        case 'delete':
          const deleteResult = await userService.bulkDelete(selectedUserIds);
          result = deleteResult.data;
          break;
        case 'role':
          if (params?.role) {
            const roleResult = await userService.bulkUpdate(selectedUserIds, { role: params.role });
            result = roleResult.data;
          }
          break;
        case 'organization':
          // Handle organization assignment individually (not yet bulk API)
          let successCount = 0;
          let errorCount = 0;
          for (const userId of selectedUserIds) {
            try {
              await organizationService.assignUserToOrganization({
                userId,
                organizationId: params.organizationId || null,
                departmentId: params.departmentId || null,
              });
              successCount++;
            } catch (err) {
              errorCount++;
            }
          }
          result = { successCount, failureCount: errorCount };
          break;
      }

      if (result) {
        const message = `Operation completed: ${result.successCount} succeeded${result.failureCount > 0 ? `, ${result.failureCount} failed` : ''}`;
        showNotification(message, result.failureCount > 0 ? 'error' : 'success');
      }

      setSelectedUsers(new Set());
      setBulkActionDialog({ open: false, action: '' });
      loadUsers();
    } catch (err: any) {
      showNotification(err.message || 'Bulk operation failed', 'error');
    }
  };

  const handleBulkActionConfirm = () => {
    const { action } = bulkActionDialog;
    if (action === 'role' || action === 'organization') {
      executeBulkAction(action, bulkActionForm);
    }
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedUsers.size > 0 && (
              <>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {selectedUsers.size} selected
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<MoreVertIcon />}
                  onClick={handleBulkMenuOpen}
                >
                  Bulk Actions
                </Button>
                <Divider orientation="vertical" flexItem />
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {/* TODO: Add user functionality */}}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {error && <ErrorMessage message={error} />}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Search users"
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
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} onChange={handleRoleFilterChange} label="Role">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="USER">User</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={handleStatusFilterChange} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Users Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user.id}
                  selected={isUserSelected(user.id)}
                  hover
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isUserSelected(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.email}
                      {user.emailVerified && (
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                  </TableCell>
                  <TableCell>{user.organization?.name || '-'}</TableCell>
                  <TableCell>{user.department?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleEditUser(user)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleUserStatus(user)}
                        color={user.isActive ? 'warning' : 'success'}
                      >
                        <BlockIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Username"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
                label="Role"
              >
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select
                value={editForm.organizationId}
                onChange={(e) => {
                  const orgId = e.target.value;
                  setEditForm({ ...editForm, organizationId: orgId, departmentId: '' });
                  loadDepartments(orgId);
                }}
                label="Organization"
              >
                <MenuItem value="">None</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!editForm.organizationId}>
              <InputLabel>Department</InputLabel>
              <Select
                value={editForm.departmentId}
                onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                label="Department"
              >
                <MenuItem value="">None</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={handleBulkMenuClose}
      >
        <MenuItem onClick={() => handleBulkAction('activate')}>
          <ListItemIcon>
            <PersonAddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Activate Users</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('deactivate')}>
          <ListItemIcon>
            <PersonAddDisabledIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Deactivate Users</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction('role')}>
          <ListItemIcon>
            <GroupIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Role</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('organization')}>
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Assign to Organization</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          handleBulkMenuClose();
          if (window.confirm(`Are you sure you want to delete ${selectedUsers.size} users?`)) {
            executeBulkAction('delete');
          }
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Users</ListItemText>
        </MenuItem>
      </Menu>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog.open} onClose={() => setBulkActionDialog({ open: false, action: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {bulkActionDialog.action === 'role' && 'Change Role for Selected Users'}
          {bulkActionDialog.action === 'organization' && 'Assign Organization for Selected Users'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {bulkActionDialog.action === 'role' && (
              <FormControl fullWidth>
                <InputLabel>New Role</InputLabel>
                <Select
                  value={bulkActionForm.role || ''}
                  onChange={(e) => setBulkActionForm({ ...bulkActionForm, role: e.target.value as User['role'] })}
                  label="New Role"
                >
                  <MenuItem value="USER">User</MenuItem>
                  <MenuItem value="MANAGER">Manager</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            )}
            {bulkActionDialog.action === 'organization' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Organization</InputLabel>
                  <Select
                    value={bulkActionForm.organizationId || ''}
                    onChange={(e) => {
                      const orgId = e.target.value;
                      setBulkActionForm({ ...bulkActionForm, organizationId: orgId, departmentId: '' });
                      if (orgId) loadDepartments(orgId);
                    }}
                    label="Organization"
                  >
                    <MenuItem value="">Remove from Organization</MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!bulkActionForm.organizationId}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={bulkActionForm.departmentId || ''}
                    onChange={(e) => setBulkActionForm({ ...bulkActionForm, departmentId: e.target.value })}
                    label="Department"
                  >
                    <MenuItem value="">No Department</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            <Alert severity="info" sx={{ mt: 2 }}>
              This action will affect {selectedUsers.size} selected user{selectedUsers.size !== 1 ? 's' : ''}.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog({ open: false, action: '' })}>Cancel</Button>
          <Button 
            onClick={handleBulkActionConfirm} 
            variant="contained"
            disabled={
              (bulkActionDialog.action === 'role' && !bulkActionForm.role) ||
              (bulkActionDialog.action === 'organization' && bulkActionForm.organizationId === undefined)
            }
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Users;