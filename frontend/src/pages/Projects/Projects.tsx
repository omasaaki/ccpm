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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ProjectService } from '../../services/projectService';
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    project: Project | null;
  }>({ open: false, project: null });
  
  useEffect(() => {
    loadProjects();
  }, [page, rowsPerPage]);
  
  const loadProjects = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await ProjectService.getProjects({
        page: page + 1,
        limit: rowsPerPage,
      });
      setProjects(response.items);
      setTotalCount(response.total);
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
  
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (isLoading && projects.length === 0) {
    return <LoadingSpinner message="プロジェクトを読み込み中..." />;
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">プロジェクト一覧</Typography>
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
        <TextField
          fullWidth
          variant="outlined"
          placeholder="プロジェクトを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>プロジェクト名</TableCell>
              <TableCell>説明</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>終了日</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id} hover>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>
                  {project.startDate ? new Date(project.startDate).toLocaleDateString('ja-JP') : '-'}
                </TableCell>
                <TableCell>
                  {project.endDate ? new Date(project.endDate).toLocaleDateString('ja-JP') : '-'}
                </TableCell>
                <TableCell>
                  <StatusChip status={project.status === 'PLANNING' || project.status === 'IN_PROGRESS' || project.status === 'ON_HOLD' ? 'TODO' : project.status} />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewProject(project)}
                    title="詳細"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEditProject(project)}
                    title="編集"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(project)}
                    title="削除"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    {searchQuery
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
    </Box>
  );
};

export default Projects;