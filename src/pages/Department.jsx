import { useParams } from 'react-router-dom';
import DepartmentHub from '@/components/department/DepartmentHub';
import { DEPARTMENTS } from '@/lib/departments';

export default function Department() {
  const { deptKey } = useParams();

  if (!DEPARTMENTS[deptKey]) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <h2 className="text-lg font-bold font-jakarta text-foreground mb-1">Department not found</h2>
        <p className="text-sm text-muted-foreground">The department "{deptKey}" does not exist.</p>
      </div>
    );
  }

  return <DepartmentHub key={deptKey} deptKey={deptKey} />;
}