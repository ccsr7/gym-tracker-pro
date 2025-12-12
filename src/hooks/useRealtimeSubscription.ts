import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event: RealtimeEvent;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
}

/**
 * Hook to subscribe to Supabase Realtime changes
 *
 * @example
 * useRealtimeSubscription({
 *   table: 'workouts',
 *   event: '*',
 *   filter: `user_id=eq.${userId}`,
 *   enabled: !!userId,
 *   onChange: (payload) => {
 *     console.log('Change received!', payload);
 *     refetchWorkouts();
 *   }
 * });
 */
export function useRealtimeSubscription({
  table,
  event,
  schema = 'public',
  filter,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;
    let debounceTimeout: NodeJS.Timeout;

    const setupSubscription = async () => {
      // Create a unique channel name
      const channelName = `realtime-${table}-${Date.now()}`;

      channel = supabase.channel(channelName);

      // Build the subscription config
      const config: any = {
        event,
        schema,
        table,
      };

      if (filter) {
        config.filter = filter;
      }

      // Subscribe to database changes with debounce
      channel
        .on('postgres_changes', config, (payload) => {
          console.log(`[Realtime] ${payload.eventType} on ${table}:`, payload);

          // Clear previous timeout
          clearTimeout(debounceTimeout);

          // Debounce onChange calls to prevent rapid re-renders
          debounceTimeout = setTimeout(() => {
            // Call the appropriate handler
            if (payload.eventType === 'INSERT' && onInsert) {
              onInsert(payload);
            } else if (payload.eventType === 'UPDATE' && onUpdate) {
              onUpdate(payload);
            } else if (payload.eventType === 'DELETE' && onDelete) {
              onDelete(payload);
            }

            // Call the generic onChange handler
            if (onChange) {
              onChange(payload);
            }
          }, 300); // 300ms debounce
        })
        .subscribe((status) => {
          console.log(`[Realtime] Subscription status for ${table}:`, status);
        });
    };

    setupSubscription();

    // Cleanup function
    return () => {
      clearTimeout(debounceTimeout);
      if (channel) {
        console.log(`[Realtime] Unsubscribing from ${table}`);
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, schema, filter, enabled, onInsert, onUpdate, onDelete, onChange]);
}
