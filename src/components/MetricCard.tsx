import React from 'react';
import { LucideIcon } from 'lucide-react';

export type MetricCardVariant = 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'purple' | 'default';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string; 
  icon: LucideIcon;
  variant: MetricCardVariant;
  onClick?: () => void;
  selected?: boolean;
  className?: string; 
  layout?: 'icon-left' | 'icon-right';
  titleUppercase?: boolean;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
  onClick,
  selected = false,
  className = '',
  layout = 'icon-left',
  titleUppercase = false,
  trend
}: MetricCardProps) {
  
  const isClickable = !!onClick;
  
  // Container
  let baseCardClass = `rounded-xl shadow-sm border p-5 transition-all duration-200 h-full flex ${
    layout === 'icon-left' ? 'items-center gap-4' : 'items-center justify-between'
  } ${
    isClickable ? 'cursor-pointer hover:shadow-md' : 'group-hover:shadow-md'
  } ${className}`;

  let variantClasses = '';
  let iconContainerClasses = 'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ';
  let iconClasses = 'h-6 w-6 ';
  let titleClasses = titleUppercase 
    ? 'text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 ' 
    : 'text-sm font-medium ';
  let valueClasses = 'text-2xl font-bold text-neutral-900 dark:text-white';
  
  switch (variant) {
    case 'blue':
      variantClasses = `bg-white dark:bg-[#111A30] ${
        selected 
          ? 'border-blue-400 dark:border-[#2563EB]' 
          : 'border-indigo-200 hover:border-blue-300 dark:border-[#2563EB] dark:hover:border-[#2563EB]'
      }`;
      iconContainerClasses += 'bg-indigo-100 dark:bg-[#1D3557]';
      if (layout === 'icon-left') {
        iconContainerClasses = iconContainerClasses.replace('bg-indigo-100', 'bg-blue-100');
      }
      iconClasses += 'text-indigo-600 dark:text-[#60A5FA]';
      if (layout === 'icon-left') {
        iconClasses = iconClasses.replace('text-indigo-600', 'text-blue-600');
      }
      titleClasses += titleUppercase ? 'text-indigo-600 dark:text-[#60A5FA]' : 'text-neutral-500 dark:text-[#60A5FA]';
      break;
    case 'indigo':
    case 'purple':
      variantClasses = `bg-white dark:bg-[#1A1333] ${
        selected 
          ? 'border-indigo-400 dark:border-[#7C3AED]' 
          : 'border-indigo-200 hover:border-indigo-300 dark:border-[#7C3AED] dark:hover:border-[#7C3AED]'
      }`;
      iconContainerClasses += 'bg-indigo-100 dark:bg-[#3B0764]';
      iconClasses += 'text-indigo-600 dark:text-[#A78BFA]';
      titleClasses += titleUppercase ? 'text-indigo-600 dark:text-[#A78BFA]' : 'text-neutral-500 dark:text-[#A78BFA]';
      break;
    case 'green':
      variantClasses = `bg-white dark:bg-[#0B221A] ${
        selected 
          ? 'border-emerald-400 dark:border-[#059669]' 
          : 'border-emerald-200 hover:border-emerald-300 dark:border-[#059669] dark:hover:border-[#059669]'
      }`;
      iconContainerClasses += 'bg-emerald-100 dark:bg-[#064E3B]';
      iconClasses += 'text-emerald-600 dark:text-[#34D399]';
      titleClasses += titleUppercase ? 'text-emerald-600 dark:text-[#34D399]' : 'text-neutral-500 dark:text-[#34D399]';
      break;
    case 'amber':
      variantClasses = `bg-card dark:bg-[#22170B] ${
        selected 
          ? 'border-amber-400 dark:border-[#D97706]' 
          : 'border-amber-200 hover:border-amber-300 dark:border-[#D97706] dark:hover:border-[#D97706]'
      }`;
      iconContainerClasses += 'bg-amber-100 dark:bg-[#78350F]';
      iconClasses += 'text-amber-600 dark:text-[#FBBF24]';
      titleClasses += titleUppercase ? 'text-amber-600 dark:text-[#FBBF24]' : 'text-muted-foreground dark:text-[#FBBF24]';
      break;
    case 'red':
      variantClasses = `bg-card dark:bg-[#2B1216] ${
        selected 
          ? 'border-red-400 dark:border-[#DC2626]' 
          : 'border-red-200 hover:border-red-300 dark:border-[#DC2626] dark:hover:border-[#DC2626]'
      }`;
      iconContainerClasses += 'bg-red-100 dark:bg-[#7F1D1D]';
      iconClasses += 'text-red-600 dark:text-[#F87171]';
      titleClasses += titleUppercase ? 'text-red-600 dark:text-[#F87171]' : 'text-muted-foreground dark:text-[#F87171]';
      break;
    default:
      variantClasses = 'bg-white dark:bg-background border-neutral-200 dark:border-border';
      iconContainerClasses += 'bg-neutral-100 dark:bg-card';
      iconClasses += 'text-neutral-500';
      titleClasses += 'text-neutral-500 dark:text-neutral-400';
      break;
  }

  if (layout === 'icon-left') {
    iconContainerClasses = iconContainerClasses.replace('rounded-xl', 'rounded-full');
  }

  const contentBlock = (
    <div>
      <p className={titleClasses}>{title}</p>
      <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${titleUppercase ? 'mt-0.5' : 'mt-0.5'}`}>
        <span className={`${valueClasses} whitespace-nowrap`}>{value}</span>
        {subtitle && (
          <span className="text-xs font-medium text-neutral-500 dark:text-[#94A3B8]">
            {subtitle}
          </span>
        )}
        {trend && (
          <span className={`text-xs font-medium ml-1 whitespace-nowrap ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );

  const iconBlock = (
    <div className={iconContainerClasses}>
      <Icon className={iconClasses} />
    </div>
  );

  return (
    <div className={`${baseCardClass} ${variantClasses}`} onClick={onClick}>
      {layout === 'icon-left' ? (
        <>
          {iconBlock}
          {contentBlock}
        </>
      ) : (
        <>
          {contentBlock}
          {iconBlock}
        </>
      )}
    </div>
  );
}
