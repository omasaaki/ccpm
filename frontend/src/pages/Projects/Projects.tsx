import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Menu,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  Archive,
  Unarchive,
  People,
  MoreVert,
  Dashboard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProjectService, ProjectMember } from '../../services/projectService';
import { Project } from '../../types/api';
import { useApp } from '../../store/AppContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusChip from '../../components/ui/StatusChip';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [archivedFilter, setArchivedFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });
  const [archiveConfirm, setArchiveConfirm] = useState<{
    open: boolean;
    project: Project | null;
    action: 'archive' | 'restore';
  }>({ open: false, project: null, action: 'archive' });
  
  useEffect(() => {
    loadProjects();
  }, [page, rowsPerPage, statusFilter, archivedFilter]);
  
  const loadProjects = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await ProjectService.getProjects({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        isArchived: archivedFilter,
      });
      setProjects(response.data);
      setTotalCount(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'プロジェクトの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleCreateProject = () => {
    navigate('/projects/new');
  };
  
  const handleViewProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };
  
  const handleEditProject = (project: Project) => {
    navigate(`/projects/${project.id}/edit`);
  };
  
  const handleDeleteClick = (project: Project) => {
    setDeleteConfirm({ open: true, project });
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.project) return;
    
    try {
      await ProjectService.deleteProject(deleteConfirm.project.id);
      showNotification('プロジェクトを削除しました', 'success');
      loadProjects();
    } catch (err: any) {
      showNotification(err.message || 'プロジェクトの削除に失敗しました', 'error');
    } finally {
      setDeleteConfirm({ open: false, project: null });
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleArchiveClick = (project: Project, action: 'archive' | 'restore') => {
    setArchiveConfirm({ open: true, project, action });
    handleMenuClose();
  };

  const handleArchiveConfirm = async () => {
    if (!archiveConfirm.project) return;
    
    try {
      if (archiveConfirm.action === 'archive') {
        await ProjectService.archiveProject(archiveConfirm.project.id);
        showNotification('プロジェクトをアーカイブしました', 'success');
      } else {
        await ProjectService.restoreProject(archiveConfirm.project.id);
        showNotification('プロジェクトを復元しました', 'success');
      }
      loadProjects();
    } catch (err: any) {
      showNotification(err.message || 'プロジェクトの操作に失敗しました', 'error');
    } finally {
      setArchiveConfirm({ open: false, project: null, action: 'archive' });
    }
  };

  const handleMembersClick = (project: Project) => {
    navigate(`/projects/${project.id}/members`);
    handleMenuClose();
  };

  const handleStatisticsClick = (project: Project) => {
    navigate(`/projects/${project.id}/statistics`);
    handleMenuClose();
  };
  
  const filteredProjects = projects;
  
  if (isLoading && projects.length === 0) {
    return <LoadingSpinner message="プロジェクトを読み込み中..." />;
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          プロジェクト一覧 {archivedFilter ? '(アーカイブ)' : ''}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleCreateProject}
        >
          新規プロジェクト
        </Button>
      </Box>
      
      {error && <ErrorMessage message={error} onRetry={loadProjects} />}
      
      <Paper sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="プロジェクトを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadProjects()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                label="ステータス"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="PLANNING">計画中</MenuItem>
                <MenuItem value="IN_PROGRESS">進行中</MenuItem>
                <MenuItem value="ON_HOLD">保留中</MenuItem>
                <MenuItem value="COMPLETED">完了</MenuItem>
                <MenuItem value="CANCELLED">キャンセル</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant={archivedFilter ? 'contained' : 'outlined'}
              color={archivedFilter ? 'secondary' : 'primary'}
              onClick={() => setArchivedFilter(!archivedFilter)}
              startIcon={archivedFilter ? <Unarchive /> : <Archive />}
            >
              {archivedFilter ? 'アクティブ表示' : 'アーカイブ表示'}
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
            >
              {viewMode === 'table' ? 'カード表示' : 'テーブル表示'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>プロジェクト名</TableCell>
                <TableCell>説明</TableCell>
                <TableCell>開始日</TableCell>
                <TableCell>終了日</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>メンバー</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {project.name}
                      </Typography>
                      {project.organization && (
                        <Typography variant="caption" color="textSecondary">
                          {project.organization.name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {project.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('ja-JP') : '-'}
                  </TableCell>
                  <TableCell>
                    {project.endDate ? new Date(project.endDate).toLocaleDateString('ja-JP') : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={project.status} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${project._count?.members || 0}人`}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="詳細">
                      <IconButton
                        size="small"
                        onClick={() => handleViewProject(project)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton
                        size="small"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="その他">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, project)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      {searchQuery || statusFilter !== 'all'
                        ? '検索結果がありません'
                        : 'プロジェクトがありません'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count}件`
            }
          />
        </TableContainer>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    opacity: project.isArchived ? 0.7 : 1,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" noWrap title={project.name}>
                        {project.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, project)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    
                    {project.organization && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {project.organization.name}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>
                      {project.description || '説明なし'}
                    </Typography>
                    
                    <Box mb={2}>
                      <StatusChip status={project.status} size="small" />
                      {project.isArchived && (
                        <Chip size="small" label="アーカイブ" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <People fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">
                          {project._count?.members || 0}人
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString('ja-JP') : '未設定'}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Box p={1} pt={0}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewProject(project)}
                      startIcon={<Visibility />}
                    >
                      詳細
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {filteredProjects.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {searchQuery || statusFilter !== 'all'
                  ? '検索結果がありません'
                  : 'プロジェクトがありません'}
              </Typography>
            </Paper>
          )}
          
          <Box display="flex" justifyContent="center" mt={3}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="表示件数:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} / ${count}件`
              }
            />
          </Box>
        </>
      )}
      
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedProject && handleViewProject(selectedProject)}>
          <Visibility sx={{ mr: 1 }} />
          詳細
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleEditProject(selectedProject)}>
          <Edit sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleMembersClick(selectedProject)}>
          <People sx={{ mr: 1 }} />
          メンバー管理
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleStatisticsClick(selectedProject)}>
          <Dashboard sx={{ mr: 1 }} />
          統計
        </MenuItem>
        <MenuItem 
          onClick={() => selectedProject && handleArchiveClick(selectedProject, selectedProject.isArchived ? 'restore' : 'archive')}
        >
          {selectedProject?.isArchived ? <Unarchive sx={{ mr: 1 }} /> : <Archive sx={{ mr: 1 }} />}
          {selectedProject?.isArchived ? '復元' : 'アーカイブ'}
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleDeleteClick(selectedProject)}>
          <Delete sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>
      
      <ConfirmDialog
        open={deleteConfirm.open}
        title="プロジェクトの削除"
        message={`「${deleteConfirm.project?.name}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, project: null })}
      />
      
      <ConfirmDialog
        open={archiveConfirm.open}
        title={archiveConfirm.action === 'archive' ? 'プロジェクトのアーカイブ' : 'プロジェクトの復元'}
        message={`「${archiveConfirm.project?.name}」を${archiveConfirm.action === 'archive' ? 'アーカイブ' : '復元'}してもよろしいですか？`}
        confirmText={archiveConfirm.action === 'archive' ? 'アーカイブ' : '復元'}
        cancelText="キャンセル"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveConfirm({ open: false, project: null, action: 'archive' })}
      />
    </Box>
  );
};

export default Projects;