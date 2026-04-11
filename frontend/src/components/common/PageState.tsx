
import React from 'react';
import { Skeleton, Empty, Result, Button } from 'antd';

interface PageStateProps {
  loading?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyText?: string;
  emptyImage?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
  skeletonType?: 'table' | 'cards' | 'list' | 'dashboard';
}

const PageState: React.FC<PageStateProps> = ({
  loading,
  error,
  isEmpty,
  emptyText = "No data found",
  emptyImage,
  onRetry,
  children,
  skeletonType = 'table'
}) => {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {skeletonType === 'table' && (
          <div className="space-y-4">
            <Skeleton.Input active block style={{ height: 40 }} />
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        )}
        {skeletonType === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton.Button key={i} active block style={{ height: 120 }} />
            ))}
            <div className="col-span-full">
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          </div>
        )}
        {skeletonType === 'list' && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} active avatar={{ size: 'large', shape: 'square' }} paragraph={{ rows: 2 }} />
            ))}
          </div>
        )}
        {skeletonType === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 6].map(i => (
              <div key={i} className="glass-card p-4 rounded-lg">
                <Skeleton active paragraph={{ rows: 3 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Result
          status="error"
          title="Something went wrong"
          subTitle={error.message || "An unexpected error occurred while loading the data."}
          extra={[
            onRetry && (
              <Button type="primary" key="retry" onClick={onRetry} size="large" className="rounded-lg">
                Try Again
              </Button>
            ),
          ].filter(Boolean)}
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Empty
          image={emptyImage || Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-gray-500 font-medium">{emptyText}</span>
          }
        >
          {onRetry && (
            <Button type="primary" onClick={onRetry} size="large" className="rounded-md">
              Refresh Data
            </Button>
          )}
        </Empty>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageState;
