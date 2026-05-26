import { useNavigate } from 'react-router-dom';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { TASKS } from '../../data/mockData';
import type { TaskKey } from '../../data/types';

const VISIBLE_TASKS = TASKS;

interface TaskFooterProps {
  currentTask: TaskKey;
}

export const TaskFooter = ({ currentTask }: TaskFooterProps) => {
  const navigate = useNavigate();
  const currentIdx = VISIBLE_TASKS.findIndex((t) => t.key === currentTask);
  const prevTask = currentIdx > 0 ? VISIBLE_TASKS[currentIdx - 1] : null;
  const nextTask = currentIdx < VISIBLE_TASKS.length - 1 ? VISIBLE_TASKS[currentIdx + 1] : null;

  return (
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ background: '#ffffff' }}
    >
      {prevTask ? (
        <button
          onClick={() => navigate(prevTask.route)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-colors hover:bg-gray-50"
          style={{ fontSize: 14, fontWeight: 500, color: '#473bab', borderColor: '#473bab', background: 'transparent' }}
        >
          <ArrowBack style={{ fontSize: 16, fontWeight: 500, color: '#473bab' }} />
          {prevTask.label}
        </button>
      ) : (
        <div />
      )}
      {nextTask && (
        <button
          onClick={() => navigate(nextTask.route)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-colors hover:bg-purple-50"
          style={{ fontSize: 14, fontWeight: 500, color: '#473bab', background: 'transparent', borderColor: '#473bab' }}
        >
          {nextTask.label}
          <ArrowForward style={{ fontSize: 16, fontWeight: 500, color: '#473bab' }} />
        </button>
      )}
    </div>
  );
};
