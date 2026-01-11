import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  error: Error | null;
}

interface OptimisticOptions {
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
  showErrorToast?: boolean;
}

/**
 * Hook for optimistic UI updates with automatic rollback on failure
 */
export const useOptimisticUpdate = <T>(
  initialData: T,
  options: OptimisticOptions = {}
) => {
  const { rollbackOnError = true, showErrorToast = true, onError } = options;
  
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  });
  
  const previousDataRef = useRef<T>(initialData);

  const optimisticUpdate = useCallback(async (
    optimisticData: T,
    asyncOperation: () => Promise<T | void>
  ): Promise<boolean> => {
    // Store previous state for rollback
    previousDataRef.current = state.data;
    
    // Apply optimistic update immediately
    setState({
      data: optimisticData,
      isPending: true,
      error: null,
    });

    try {
      const result = await asyncOperation();
      
      // Update with server response if available, otherwise keep optimistic data
      setState({
        data: (result as T) ?? optimisticData,
        isPending: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Rollback to previous state
      if (rollbackOnError) {
        setState({
          data: previousDataRef.current,
          isPending: false,
          error: err,
        });
      } else {
        setState(prev => ({
          ...prev,
          isPending: false,
          error: err,
        }));
      }

      if (showErrorToast) {
        toast.error('Action failed', {
          description: 'Your change couldn\'t be saved. Please try again.',
        });
      }

      onError?.(err);
      return false;
    }
  }, [state.data, rollbackOnError, showErrorToast, onError]);

  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof newData === 'function' ? (newData as (prev: T) => T)(prev.data) : newData,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isPending: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    optimisticUpdate,
    setData,
    reset,
  };
};

/**
 * Hook for optimistic list operations (add, remove, update)
 */
export const useOptimisticList = <T extends { id: string | number }>(
  initialItems: T[],
  options: OptimisticOptions = {}
) => {
  const { data: items, isPending, error, optimisticUpdate, setData, reset } = 
    useOptimisticUpdate(initialItems, options);

  const addItem = useCallback(async (
    newItem: T,
    asyncOperation: () => Promise<void>
  ) => {
    const optimisticItems = [...items, newItem];
    return optimisticUpdate(
      optimisticItems,
      async () => {
        await asyncOperation();
        return optimisticItems;
      }
    );
  }, [items, optimisticUpdate]);

  const removeItem = useCallback(async (
    itemId: string | number,
    asyncOperation: () => Promise<void>
  ) => {
    const optimisticItems = items.filter(item => item.id !== itemId);
    return optimisticUpdate(
      optimisticItems,
      async () => {
        await asyncOperation();
        return optimisticItems;
      }
    );
  }, [items, optimisticUpdate]);

  const updateItem = useCallback(async (
    itemId: string | number,
    updates: Partial<T>,
    asyncOperation: () => Promise<void>
  ) => {
    const optimisticItems = items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    return optimisticUpdate(
      optimisticItems,
      async () => {
        await asyncOperation();
        return optimisticItems;
      }
    );
  }, [items, optimisticUpdate]);

  return {
    items,
    isPending,
    error,
    addItem,
    removeItem,
    updateItem,
    setItems: setData,
    reset,
  };
};
