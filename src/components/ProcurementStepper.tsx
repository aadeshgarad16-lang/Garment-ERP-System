import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, FilePlus } from 'lucide-react';
import styles from './procurement-stepper.module.css';

interface Step {
  name: string;
  icon: React.ReactElement;
  color: string; // Tailwind text color class
  href: string;
  count: number;
}

const ProcurementStepper: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState({ dashboard: 0, review: 0, create: 0 });

  // Fetch pending procurement counts (replace with real data source as needed)
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/procurement-requests?status=PENDING');
        const data = await res.json();
        const pending = Array.isArray(data?.procurementRequests)
          ? data.procurementRequests.length
          : 0;
        // For demonstration, use same count for all steps
        setCounts({ dashboard: pending, review: pending, create: pending });
      } catch (e) {
        console.error('Failed to fetch procurement counts', e);
      }
    };
    fetchCounts();
  }, []);

  const steps: Step[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />, // emerald green
      color: 'text-emerald-500',
      href: '/procurement',
      count: counts.dashboard,
    },
    {
      name: 'Review PO',
      icon: <ClipboardCheck className="w-5 h-5" />, // amber orange
      color: 'text-amber-500',
      href: '/procurement/review-po',
      count: counts.review,
    },
    {
      name: 'Create PO',
      icon: <FilePlus className="w-5 h-5" />, // violet/purple
      color: 'text-violet-500',
      href: '/procurement/create-po',
      count: counts.create,
    },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, idx) => (
        <React.Fragment key={step.name}>
          <div
            className={`${styles.step} ${isActive(step.href) ? styles.activeStep : ''}`}
            onClick={() => router.push(step.href)}
          >
            <div className={`${styles.iconWrapper} ${step.color}`}>{step.icon}</div>
            <div className={styles.label}>{step.name}</div>
            <span className={styles.badge}> {step.count} Pending </span>
          </div>
          {idx < steps.length - 1 && <div className={styles.divider}>›</div>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProcurementStepper;
