import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Assignment,
  Folder,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { ProjectService } from '../../services/projectService';
import { TaskService } from '../../services/taskService';
import { Project, Task } from '../../types/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import StatusChip from '../../components/ui/StatusChip';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load projects
      const projectsResponse = await ProjectService.getProjects({ limit: 5 });
      setRecentProjects(projectsResponse.items);
      
      // Calculate stats
      const activeProjects = projectsResponse.items.filter(
        p => p.status === 'IN_PROGRESS'
      ).length;
      
      // Load tasks from first few projects
      let allTasks: Task[] = [];
      for (const project of projectsResponse.items.slice(0, 3)) {
        const tasksResponse = await TaskService.getTasksByProject(project.id, { limit: 10 });
        allTasks = [...allTasks, ...tasksResponse.items];
      }
      
      // Sort tasks by updated date and take recent ones
      allTasks.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setRecentTasks(allTasks.slice(0, 5));
      
      // Calculate task stats
      const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
      const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const todoTasks = allTasks.filter(t => t.status === 'TODO').length;
      
      setStats({
        totalProjects: projectsResponse.total,
        activeProjects,
        totalTasks: allTasks.length,
        completedTasks,
        inProgressTasks,
        todoTasks,
      });
    } catch (err: any) {
      setError(err.message || 'ダッシュボードデータの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner message="ダッシュボードを読み込み中..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }
  
  const taskCompletionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        こんにちは、{user?.username}さん
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Folder color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  プロジェクト
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalProjects}</Typography>
              <Typography variant="body2" color="textSecondary">
                アクティブ: {stats.activeProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  タスク総数
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalTasks}</Typography>
              <Typography variant="body2" color="textSecondary">
                全プロジェクト合計
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  進行中
                </Typography>
              </Box>
              <Typography variant="h4">{stats.inProgressTasks}</Typography>
              <Typography variant="body2" color="textSecondary">
                タスク
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  完了率
                </Typography>
              </Box>
              <Typography variant="h4">{taskCompletionRate}%</Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.completedTasks} / {stats.totalTasks} タスク
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Progress Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              タスク進捗状況
            </Typography>
            <Box display="flex" alignItems="center" mb={2}>
              <Box width="100%" mr={2}>
                <LinearProgress 
                  variant="determinate" 
                  value={taskCompletionRate} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary" minWidth={50}>
                {taskCompletionRate}%
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">
                  未着手: {stats.todoTasks}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">
                  進行中: {stats.inProgressTasks}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="textSecondary">
                  完了: {stats.completedTasks}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              最近のプロジェクト
            </Typography>
            {recentProjects.length === 0 ? (
              <Typography color="textSecondary">
                プロジェクトがありません
              </Typography>
            ) : (
              <List>
                {recentProjects.map((project) => (
                  <ListItem
                    key={project.id}
                    button
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <ListItemText
                      primary={project.name}
                      secondary={project.description}
                    />
                    <ListItemSecondaryAction>
                      <StatusChip status={project.status === 'PLANNING' || project.status === 'ON_HOLD' ? 'TODO' : project.status} />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              最近のタスク
            </Typography>
            {recentTasks.length === 0 ? (
              <Typography color="textSecondary">
                タスクがありません
              </Typography>
            ) : (
              <List>
                {recentTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <ListItemText
                      primary={task.name || task.title || 'Untitled'}
                      secondary={task.endDate ? `期限: ${new Date(task.endDate).toLocaleDateString('ja-JP')}` : '期限未設定'}
                    />
                    <ListItemSecondaryAction>
                      <StatusChip status={task.status === 'ON_HOLD' ? 'TODO' : task.status} />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;