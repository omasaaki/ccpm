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
  Chip,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TaskService } from '../../services/taskService';
import { ProjectService } from '../../services/projectService';
import { Task, Project } from '../../types/api';
import { useApp } from '../../store/AppContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusChip from '../../components/ui/StatusChip';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useApp();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  useEffect(() => {
    if (selectedProject !== 'all') {
      loadTasks();
    }
  }, [page, rowsPerPage, selectedProject]);
  
  const loadProjects = async () => {
    try {
      const response = await ProjectService.getProjects({ limit: 100 });
      setProjects(response.items);
      
      // Load tasks from first project if available
      if (response.items.length > 0 && response.items[0]) {
        setSelectedProject(response.items[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'プロジェクトの読み込みに失敗しました');
    }
  };
  
  const loadTasks = async () => {
    if (selectedProject === 'all') return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await TaskService.getTasksByProject(selectedProject, {
        page: page + 1,
        limit: rowsPerPage,
      });
      setTasks(response.items);
      setTotalCount(response.total);
    } catch (err: any) {
      setError(err.message || 'タスクの読み込みに失敗しました');
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
  
  const handleCreateTask = () => {
    if (selectedProject === 'all') {
      showNotification('プロジェクトを選択してください', 'warning');
      return;
    }
    navigate(`/projects/${selectedProject}/tasks/new`);
  };
  
  const handleViewTask = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };
  
  const handleEditTask = (task: Task) => {
    navigate(`/tasks/${task.id}/edit`);
  };
  
  const handleDeleteClick = (task: Task) => {
    setDeleteConfirm({ open: true, task });
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.task) return;
    
    try {
      await TaskService.deleteTask(deleteConfirm.task.id);
      showNotification('タスクを削除しました', 'success');
      loadTasks();
    } catch (err: any) {
      showNotification(err.message || 'タスクの削除に失敗しました', 'error');
    } finally {
      setDeleteConfirm({ open: false, task: null });
    }
  };
  
  // const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
  //   try {
  //     await TaskService.updateTaskStatus(task.id, newStatus);
  //     showNotification('ステータスを更新しました', 'success');
  //     loadTasks();
  //   } catch (err: any) {
  //     showNotification(err.message || 'ステータスの更新に失敗しました', 'error');
  //   }
  // };
  
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      (task.name || task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };
  
  if (isLoading && tasks.length === 0 && projects.length === 0) {
    return <LoadingSpinner message="データを読み込み中..." />;
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">タスク一覧</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleCreateTask}
          disabled={selectedProject === 'all'}
        >
          新規タスク
        </Button>
      </Box>
      
      {error && <ErrorMessage message={error} onRetry={loadTasks} />}
      
      <Paper sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>プロジェクト</InputLabel>
              <Select
                value={selectedProject}
                label="プロジェクト"
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all" disabled>
                  プロジェクトを選択
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="タスクを検索..."
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
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                label="ステータス"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="TODO">未着手</MenuItem>
                <MenuItem value="IN_PROGRESS">進行中</MenuItem>
                <MenuItem value="COMPLETED">完了</MenuItem>
                <MenuItem value="CANCELLED">キャンセル</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {selectedProject === 'all' ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="textSecondary" align="center">
            プロジェクトを選択してタスクを表示してください
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>タスク名</TableCell>
                <TableCell>説明</TableCell>
                <TableCell>優先度</TableCell>
                <TableCell>開始日</TableCell>
                <TableCell>終了日</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>{task.name || task.title || 'Untitled'}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.startDate ? new Date(task.startDate).toLocaleDateString('ja-JP') : '-'}
                  </TableCell>
                  <TableCell>
                    {task.endDate ? new Date(task.endDate).toLocaleDateString('ja-JP') : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={task.status === 'ON_HOLD' ? 'TODO' : task.status} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewTask(task)}
                      title="詳細"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditTask(task)}
                      title="編集"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(task)}
                      title="削除"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      {searchQuery || statusFilter !== 'all'
                        ? '検索結果がありません'
                        : 'タスクがありません'}
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
      )}
      
      <ConfirmDialog
        open={deleteConfirm.open}
        title="タスクの削除"
        message={`「${deleteConfirm.task?.name || deleteConfirm.task?.title || 'Untitled'}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        severity="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, task: null })}
      />
    </Box>
  );
};

export default Tasks;